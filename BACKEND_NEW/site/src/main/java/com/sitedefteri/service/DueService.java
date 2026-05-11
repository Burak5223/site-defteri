package com.sitedefteri.service;

import com.sitedefteri.dto.request.CreateDueRequest;
import com.sitedefteri.dto.response.DueResponse;
import com.sitedefteri.entity.Due;
import com.sitedefteri.exception.ResourceNotFoundException;
import com.sitedefteri.repository.ApartmentRepository;
import com.sitedefteri.repository.DueRepository;
import com.sitedefteri.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DueService {
    
    private final DueRepository dueRepository;
    private final ApartmentRepository apartmentRepository;
    private final UserRepository userRepository;
    
    @Transactional(readOnly = true)
    public List<DueResponse> getDuesByApartment(String apartmentId) {
        log.info("Fetching dues for apartment: {}", apartmentId);
        return dueRepository.findByApartmentIdOrderByDueDateDesc(apartmentId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<DueResponse> getAllDues() {
        log.info("Fetching all dues");
        return dueRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<DueResponse> getDuesBySite(String siteId) {
        log.info("Fetching dues for site: {}", siteId);
        // Site ID'ye göre aidatları getir - apartmentlar üzerinden site filtrelemesi yap
        List<String> apartmentIds = apartmentRepository.findBySiteId(siteId)
                .stream()
                .map(apartment -> apartment.getId())
                .collect(Collectors.toList());
        
        if (apartmentIds.isEmpty()) {
            log.warn("No apartments found for site: {}", siteId);
            return List.of();
        }
        
        return dueRepository.findByApartmentIdInOrderByDueDateDesc(apartmentIds)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<DueResponse> getDuesByUserId(String userId) {
        log.info("Fetching dues for user: {}", userId);
        // Kullanıcının residency_history tablosunda aktif olarak kayıtlı olduğu daireleri bul
        List<String> apartmentIds = apartmentRepository.findByActiveResidency(userId)
                .stream()
                .map(apartment -> apartment.getId())
                .collect(Collectors.toList());
        
        if (apartmentIds.isEmpty()) {
            log.warn("No active residency found for user: {}", userId);
            return List.of();
        }
        
        log.info("Found {} apartments for user {}: {}", apartmentIds.size(), userId, apartmentIds);
        
        return dueRepository.findByApartmentIdInOrderByDueDateDesc(apartmentIds)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public DueResponse createDue(CreateDueRequest request) {
        log.info("Creating due for apartment: {}", request.getApartmentId());
        
        // Apartmanın site ID'sini kontrol et
        var apartment = apartmentRepository.findById(request.getApartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Apartment", "id", request.getApartmentId()));
        
        Due due = new Due();
        // Use current month's financial period (February 2026)
        due.setFinancialPeriodId("fp-2026-02");
        due.setApartmentId(request.getApartmentId());
        due.setBaseAmount(request.getAmount());
        due.setTotalAmount(request.getAmount());
        due.setCurrencyCode("TRY");
        due.setDueDate(request.getDueDate());
        due.setDescription(request.getDescription());
        due.setStatus(Due.DueStatus.bekliyor); // Varsayılan durum
        
        Due saved = dueRepository.save(due);
        log.info("Due created with ID: {} for site: {}", saved.getId(), apartment.getSiteId());
        return toResponse(saved);
    }
    
    @Transactional
    public DueResponse updateDueStatus(String dueId, String status) {
        log.info("Updating due status: {} to {}", dueId, status);
        
        Due due = dueRepository.findById(dueId)
                .orElseThrow(() -> new ResourceNotFoundException("Aidat", "id", dueId));
        
        due.setStatus(Due.DueStatus.valueOf(status));
        Due updated = dueRepository.save(due);
        return toResponse(updated);
    }
    
    @Transactional(readOnly = true)
    public DueResponse getDueById(String dueId) {
        log.info("Fetching due detail: {}", dueId);
        Due due = dueRepository.findById(dueId)
                .orElseThrow(() -> new ResourceNotFoundException("Aidat", "id", dueId));
        return toResponse(due);
    }
    
    @Transactional
    public DueResponse updateDue(String dueId, CreateDueRequest request) {
        log.info("Updating due: {}", dueId);
        
        Due due = dueRepository.findById(dueId)
                .orElseThrow(() -> new ResourceNotFoundException("Aidat", "id", dueId));
        
        due.setApartmentId(request.getApartmentId());
        due.setBaseAmount(request.getAmount());
        due.setTotalAmount(request.getAmount());
        due.setDueDate(request.getDueDate());
        due.setDescription(request.getDescription());
        
        Due updated = dueRepository.save(due);
        log.info("Due updated: {}", dueId);
        return toResponse(updated);
    }
    
    @Transactional
    public void deleteDue(String dueId) {
        log.info("Deleting due: {}", dueId);
        
        Due due = dueRepository.findById(dueId)
                .orElseThrow(() -> new ResourceNotFoundException("Aidat", "id", dueId));
        
        dueRepository.delete(due);
        log.info("Due deleted: {}", dueId);
    }
    
    private DueResponse toResponse(Due due) {
        DueResponse response = new DueResponse();
        response.setId(due.getId());
        response.setApartmentId(due.getApartmentId());
        response.setAmount(due.getTotalAmount());
        response.setDueDate(due.getDueDate());
        response.setStatus(mapStatusToEnglish(due.getStatus()));
        response.setDescription(due.getDescription());
        
        // Get apartment details
        apartmentRepository.findById(due.getApartmentId()).ifPresent(apartment -> {
            response.setApartmentNumber(apartment.getUnitNumber());
            
            // Get resident name (current resident or owner)
            if (apartment.getCurrentResidentId() != null) {
                userRepository.findById(apartment.getCurrentResidentId()).ifPresent(user -> {
                    response.setResidentName(user.getFullName());
                });
            }
            
            // Get owner name
            if (apartment.getOwnerUserId() != null) {
                userRepository.findById(apartment.getOwnerUserId()).ifPresent(user -> {
                    response.setOwnerName(user.getFullName());
                });
            }
        });
        
        // Extract month and year from due date
        if (due.getDueDate() != null) {
            String[] months = {"Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", 
                             "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"};
            response.setMonth(months[due.getDueDate().getMonthValue() - 1]);
            response.setYear(due.getDueDate().getYear());
            response.setPeriod(response.getMonth() + " " + response.getYear());
        }
        
        return response;
    }
    
    /**
     * Map Turkish enum status to English status for frontend
     */
    private String mapStatusToEnglish(Due.DueStatus status) {
        switch (status) {
            case odendi:
                return "paid";
            case bekliyor:
                return "bekliyor";  // Keep Turkish status for consistency
            case kismi_odendi:
                return "partially_paid";
            case gecikmis:
                return "overdue";
            case iptal_edildi:
                return "cancelled";
            default:
                return "bekliyor";  // Default to pending
        }
    }
}
