package com.sitedefteri.service;

import com.sitedefteri.dto.request.CreateVisitorRequest;
import com.sitedefteri.dto.response.VisitorResponse;
import com.sitedefteri.entity.Visitor;
import com.sitedefteri.exception.ResourceNotFoundException;
import com.sitedefteri.repository.VisitorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VisitorService {
    
    private final VisitorRepository visitorRepository;
    
    @Transactional(readOnly = true)
    public List<VisitorResponse> getVisitorsByApartment(String apartmentId) {
        log.info("Fetching visitors for apartment: {}", apartmentId);
        return visitorRepository.findByApartmentIdOrderByExpectedAtDesc(apartmentId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<VisitorResponse> getAllVisitors() {
        log.info("Fetching all visitors");
        return visitorRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public VisitorResponse createVisitor(CreateVisitorRequest request) {
        log.info("Creating visitor for apartment: {}", request.getApartmentId());
        
        Visitor visitor = new Visitor();
        visitor.setApartmentId(request.getApartmentId());
        visitor.setSiteId(request.getSiteId() != null ? request.getSiteId() : "1");
        visitor.setVisitorName(request.getVisitorName());
        visitor.setVisitorPhone(request.getVisitorPhone());
        visitor.setExpectedAt(request.getExpectedAt());
        visitor.setPurpose(request.getPurpose());
        visitor.setVehiclePlate(request.getVehiclePlate());
        visitor.setStatus("pending"); // Güvenlik onayı bekliyor
        
        Visitor saved = visitorRepository.save(visitor);
        log.info("Visitor created with ID: {} - Status: pending (awaiting security approval)", saved.getId());
        return toResponse(saved);
    }
    
    @Transactional
    public VisitorResponse checkInVisitor(String visitorId) {
        log.info("Checking in visitor: {}", visitorId);
        
        Visitor visitor = visitorRepository.findById(visitorId)
                .orElseThrow(() -> new ResourceNotFoundException("Ziyaretçi", "id", visitorId));
        
        visitor.setArrivedAt(LocalDateTime.now());
        visitor.setStatus("active"); // Güvenlik onayladı ve içeride
        Visitor updated = visitorRepository.save(visitor);
        log.info("Visitor checked in and approved by security: {}", visitorId);
        return toResponse(updated);
    }
    
    @Transactional
    public VisitorResponse checkOutVisitor(String visitorId) {
        log.info("Checking out visitor: {}", visitorId);
        
        Visitor visitor = visitorRepository.findById(visitorId)
                .orElseThrow(() -> new ResourceNotFoundException("Ziyaretçi", "id", visitorId));
        
        visitor.setLeftAt(LocalDateTime.now());
        visitor.setStatus("completed"); // Çıkış yapınca "completed" olsun
        Visitor updated = visitorRepository.save(visitor);
        log.info("Visitor checked out: {}", visitorId);
        return toResponse(updated);
    }
    
    @Transactional
    public VisitorResponse updateVisitor(String visitorId, CreateVisitorRequest request) {
        log.info("Updating visitor: {}", visitorId);
        
        Visitor visitor = visitorRepository.findById(visitorId)
                .orElseThrow(() -> new ResourceNotFoundException("Ziyaretçi", "id", visitorId));
        
        visitor.setVisitorName(request.getVisitorName());
        visitor.setVisitorPhone(request.getVisitorPhone());
        visitor.setExpectedAt(request.getExpectedAt());
        visitor.setPurpose(request.getPurpose());
        visitor.setVehiclePlate(request.getVehiclePlate());
        
        Visitor updated = visitorRepository.save(visitor);
        log.info("Visitor updated: {}", visitorId);
        return toResponse(updated);
    }
    
    @Transactional
    public void deleteVisitor(String visitorId) {
        log.info("Deleting visitor: {}", visitorId);
        
        Visitor visitor = visitorRepository.findById(visitorId)
                .orElseThrow(() -> new ResourceNotFoundException("Ziyaretçi", "id", visitorId));
        
        visitorRepository.delete(visitor);
        log.info("Visitor deleted: {}", visitorId);
    }
    
    private VisitorResponse toResponse(Visitor visitor) {
        VisitorResponse response = new VisitorResponse();
        response.setId(visitor.getId());
        response.setApartmentId(visitor.getApartmentId());
        response.setVisitorName(visitor.getVisitorName());
        response.setVisitorPhone(visitor.getVisitorPhone());
        response.setVehiclePlate(visitor.getVehiclePlate());
        response.setPurpose(visitor.getPurpose());
        response.setExpectedAt(visitor.getExpectedAt());
        response.setArrivedAt(visitor.getArrivedAt());
        response.setLeftAt(visitor.getLeftAt());
        response.setStatus(visitor.getStatus());
        response.setNotes(visitor.getNotes());
        return response;
    }
}
