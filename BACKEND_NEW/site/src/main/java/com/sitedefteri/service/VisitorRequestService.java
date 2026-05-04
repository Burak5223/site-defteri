package com.sitedefteri.service;

import com.sitedefteri.dto.request.CreateVisitorRequestRequest;
import com.sitedefteri.dto.request.ReviewVisitorRequestRequest;
import com.sitedefteri.dto.response.VisitorRequestResponse;
import com.sitedefteri.entity.*;
import com.sitedefteri.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VisitorRequestService {
    
    private final VisitorRequestRepository visitorRequestRepository;
    private final VisitorRequestItemRepository visitorRequestItemRepository;
    private final VisitorRepository visitorRepository;
    private final UserRepository userRepository;
    private final ApartmentRepository apartmentRepository;
    
    @Transactional
    public VisitorRequestResponse createVisitorRequest(String userId, CreateVisitorRequestRequest request) {
        log.info("Creating visitor request for user: {}", userId);
        
        // Get user to find apartment and site
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Create visitor request
        VisitorRequest visitorRequest = new VisitorRequest();
        visitorRequest.setId(UUID.randomUUID().toString());
        visitorRequest.setRequestedBy(userId);
        visitorRequest.setSiteId(user.getSiteId());
        
        // Find user's apartment
        String apartmentId = findUserApartment(userId, user.getSiteId());
        visitorRequest.setApartmentId(apartmentId);
        
        visitorRequest.setRequestDate(LocalDateTime.now());
        visitorRequest.setExpectedVisitDate(request.getExpectedVisitDate());
        visitorRequest.setStatus("pending");
        visitorRequest.setNotes(request.getNotes());
        
        // Add visitors
        for (CreateVisitorRequestRequest.VisitorItemRequest visitorItem : request.getVisitors()) {
            VisitorRequestItem item = new VisitorRequestItem();
            item.setId(UUID.randomUUID().toString());
            item.setVisitorName(visitorItem.getVisitorName());
            item.setVisitorPhone(visitorItem.getVisitorPhone());
            item.setVehiclePlate(visitorItem.getVehiclePlate());
            item.setStayStartDate(visitorItem.getStayStartDate());
            item.setStayDurationDays(visitorItem.getStayDurationDays() != null ? visitorItem.getStayDurationDays() : 1);
            item.setItemNotes(visitorItem.getItemNotes());
            visitorRequest.addVisitor(item);
        }
        
        visitorRequest = visitorRequestRepository.save(visitorRequest);
        log.info("Visitor request created with ID: {}", visitorRequest.getId());
        
        return mapToResponse(visitorRequest);
    }
    
    public List<VisitorRequestResponse> getMyRequests(String userId) {
        List<VisitorRequest> requests = visitorRequestRepository.findByRequestedByOrderByRequestDateDesc(userId);
        return requests.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    public List<VisitorRequestResponse> getAllRequests(String siteId) {
        List<VisitorRequest> requests = visitorRequestRepository.findBySiteIdOrderByRequestDateDesc(siteId);
        return requests.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    public List<VisitorRequestResponse> getPendingRequests(String siteId) {
        List<VisitorRequest> requests = visitorRequestRepository.findPendingRequestsBySite(siteId);
        return requests.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    public String getUserSiteId(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getSiteId();
    }
    
    public VisitorRequestResponse getRequestById(String requestId) {
        VisitorRequest request = visitorRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Visitor request not found"));
        return mapToResponse(request);
    }
    
    @Transactional
    public VisitorRequestResponse approveRequest(String requestId, String reviewerId, ReviewVisitorRequestRequest reviewRequest) {
        log.info("Approving visitor request: {} by user: {}", requestId, reviewerId);
        
        VisitorRequest request = visitorRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Visitor request not found"));
        
        if (!"pending".equals(request.getStatus())) {
            throw new RuntimeException("Only pending requests can be approved");
        }
        
        // Update request status
        request.setStatus("approved");
        request.setReviewedBy(reviewerId);
        request.setReviewedAt(LocalDateTime.now());
        request.setReviewNotes(reviewRequest.getReviewNotes());
        
        // Create Visitor entries for each visitor in the request
        for (VisitorRequestItem item : request.getVisitors()) {
            Visitor visitor = new Visitor();
            visitor.setId(UUID.randomUUID().toString());
            visitor.setApartmentId(request.getApartmentId());
            visitor.setSiteId(request.getSiteId());
            visitor.setVisitorName(item.getVisitorName());
            visitor.setVisitorPhone(item.getVisitorPhone());
            visitor.setVehiclePlate(item.getVehiclePlate());
            visitor.setPurpose("Approved visitor request");
            visitor.setExpectedAt(request.getExpectedVisitDate());
            
            // Kalış süresi hesaplama
            LocalDateTime stayStart = item.getStayStartDate() != null ? item.getStayStartDate() : request.getExpectedVisitDate();
            int durationDays = item.getStayDurationDays() != null ? item.getStayDurationDays() : 1;
            LocalDateTime stayEnd = stayStart.plusDays(durationDays);
            
            visitor.setStayStartDate(stayStart);
            visitor.setStayEndDate(stayEnd);
            visitor.setIsActive(true); // Başlangıçta aktif
            
            visitor.setStatus("pending"); // Waiting for check-in
            visitor.setAuthorizedBy(reviewerId);
            visitor.setNotes(item.getItemNotes());
            
            visitorRepository.save(visitor);
            log.info("Created visitor entry: {} for request: {} (Stay: {} to {})", 
                    visitor.getId(), requestId, stayStart, stayEnd);
        }
        
        request = visitorRequestRepository.save(request);
        log.info("Visitor request approved: {}", requestId);
        
        return mapToResponse(request);
    }
    
    @Transactional
    public VisitorRequestResponse rejectRequest(String requestId, String reviewerId, ReviewVisitorRequestRequest reviewRequest) {
        log.info("Rejecting visitor request: {} by user: {}", requestId, reviewerId);
        
        VisitorRequest request = visitorRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Visitor request not found"));
        
        if (!"pending".equals(request.getStatus())) {
            throw new RuntimeException("Only pending requests can be rejected");
        }
        
        request.setStatus("rejected");
        request.setReviewedBy(reviewerId);
        request.setReviewedAt(LocalDateTime.now());
        request.setReviewNotes(reviewRequest.getReviewNotes());
        
        request = visitorRequestRepository.save(request);
        log.info("Visitor request rejected: {}", requestId);
        
        return mapToResponse(request);
    }
    
    @Transactional
    public void cancelRequest(String requestId, String userId) {
        log.info("Cancelling visitor request: {} by user: {}", requestId, userId);
        
        VisitorRequest request = visitorRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Visitor request not found"));
        
        if (!request.getRequestedBy().equals(userId)) {
            throw new RuntimeException("You can only cancel your own requests");
        }
        
        if (!"pending".equals(request.getStatus())) {
            throw new RuntimeException("Only pending requests can be cancelled");
        }
        
        request.setStatus("cancelled");
        visitorRequestRepository.save(request);
        log.info("Visitor request cancelled: {}", requestId);
    }
    
    private String findUserApartment(String userId, String siteId) {
        // Try to find apartment from user's residency or membership
        List<Apartment> apartments = apartmentRepository.findBySiteId(siteId);
        
        // For now, return first apartment or create a default one
        // In production, this should be properly linked to user's apartment
        if (!apartments.isEmpty()) {
            return apartments.get(0).getId();
        }
        
        return "1"; // Default apartment ID
    }
    
    private VisitorRequestResponse mapToResponse(VisitorRequest request) {
        VisitorRequestResponse response = new VisitorRequestResponse();
        response.setId(request.getId());
        response.setApartmentId(request.getApartmentId());
        response.setSiteId(request.getSiteId());
        response.setRequestedBy(request.getRequestedBy());
        response.setRequestDate(request.getRequestDate());
        response.setExpectedVisitDate(request.getExpectedVisitDate());
        response.setStatus(request.getStatus());
        response.setNotes(request.getNotes());
        response.setReviewedBy(request.getReviewedBy());
        response.setReviewedAt(request.getReviewedAt());
        response.setReviewNotes(request.getReviewNotes());
        
        // Get apartment number
        apartmentRepository.findById(request.getApartmentId()).ifPresent(apt -> 
            response.setApartmentNumber(apt.getUnitNumber())
        );
        
        // Get requester name
        userRepository.findById(request.getRequestedBy()).ifPresent(user -> 
            response.setRequestedByName(user.getFullName())
        );
        
        // Get reviewer name
        if (request.getReviewedBy() != null) {
            userRepository.findById(request.getReviewedBy()).ifPresent(user -> 
                response.setReviewedByName(user.getFullName())
            );
        }
        
        // Map visitors
        List<VisitorRequestResponse.VisitorItemResponse> visitors = request.getVisitors().stream()
                .map(item -> {
                    VisitorRequestResponse.VisitorItemResponse itemResponse = new VisitorRequestResponse.VisitorItemResponse();
                    itemResponse.setId(item.getId());
                    itemResponse.setVisitorName(item.getVisitorName());
                    itemResponse.setVisitorPhone(item.getVisitorPhone());
                    itemResponse.setVehiclePlate(item.getVehiclePlate());
                    itemResponse.setStayStartDate(item.getStayStartDate());
                    itemResponse.setStayDurationDays(item.getStayDurationDays());
                    itemResponse.setItemNotes(item.getItemNotes());
                    return itemResponse;
                })
                .collect(Collectors.toList());
        response.setVisitors(visitors);
        
        return response;
    }
}
