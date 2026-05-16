package com.sitedefteri.service;

import com.sitedefteri.dto.request.CreateApartmentRequest;
import com.sitedefteri.dto.response.ApartmentResponse;
import com.sitedefteri.entity.Apartment;
import com.sitedefteri.entity.Block;
import com.sitedefteri.exception.ResourceNotFoundException;
import com.sitedefteri.repository.ApartmentRepository;
import com.sitedefteri.repository.BlockRepository;
import com.sitedefteri.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ApartmentService {
    
    private final ApartmentRepository apartmentRepository;
    private final BlockRepository blockRepository;
    private final UserRepository userRepository;
    
    @Transactional(readOnly = true)
    public List<ApartmentResponse> getApartmentsByBlock(String blockId) {
        List<Apartment> apartments = apartmentRepository.findByBlockId(blockId);
        List<Apartment> unique = dedupeByUnitNumberPreserveOrder(apartments);
        return unique.stream().map(this::mapToResponse).collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ApartmentResponse> getApartmentsWithResidentsByBlock(String blockId) {
        log.info("Fetching apartments with residents for block: {}", blockId);
        List<Apartment> apartments = apartmentRepository.findByBlockId(blockId);
        List<Apartment> unique = dedupeByUnitNumberPreserveOrder(apartments);
        return unique.stream().map(this::mapToResponseWithResidents).collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ApartmentResponse> getApartmentsBySite(String siteId) {
        log.info("Fetching apartments for site: {}", siteId);
        // Get all blocks for this site
        List<Block> blocks = blockRepository.findBySiteId(siteId);
        
        // Get all apartments for these blocks
        List<Apartment> apartments = blocks.stream()
                .flatMap(block -> apartmentRepository.findByBlockId(block.getId()).stream())
                .collect(Collectors.toList());

        // Site genelinde aynı (blockId + unitNumber) kombinasyonu tekrar ediyorsa tekilleştir.
        List<Apartment> unique = dedupeByBlockAndUnitNumberPreserveOrder(apartments);
        return unique.stream().map(this::mapToResponse).collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ApartmentResponse> getAllApartments() {
        log.info("Fetching all apartments");
        return apartmentRepository.findAll().stream()
                .filter(apt -> !apt.getIsDeleted())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public ApartmentResponse getApartmentById(String id) {
        Apartment apartment = apartmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Daire bulunamadı: " + id));
        return mapToResponse(apartment);
    }
    
    @Transactional
    public ApartmentResponse createApartment(String blockId, CreateApartmentRequest request) {
        blockRepository.findById(blockId)
                .orElseThrow(() -> new ResourceNotFoundException("Blok bulunamadı: " + blockId));
        
        Apartment apartment = new Apartment();
        apartment.setBlockId(blockId);
        apartment.setUnitNumber(request.getUnitNumber());
        apartment.setFloor(request.getFloor());
        apartment.setUnitType(request.getUnitType());
        apartment.setArea(request.getArea());
        apartment.setBedrooms(request.getBedrooms());
        apartment.setBathrooms(request.getBathrooms());
        
        if (request.getStatus() != null) {
            apartment.setStatus(Apartment.ApartmentStatus.valueOf(request.getStatus()));
        }
        
        apartment = apartmentRepository.save(apartment);
        log.info("Apartment created: {} in block {} ({})", apartment.getUnitNumber(), blockId, apartment.getId());
        
        return mapToResponse(apartment);
    }
    
    @Transactional
    public ApartmentResponse updateApartment(String id, CreateApartmentRequest request) {
        Apartment apartment = apartmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Daire bulunamadı: " + id));
        
        if (request.getUnitNumber() != null) apartment.setUnitNumber(request.getUnitNumber());
        if (request.getFloor() != null) apartment.setFloor(request.getFloor());
        if (request.getUnitType() != null) apartment.setUnitType(request.getUnitType());
        if (request.getArea() != null) apartment.setArea(request.getArea());
        if (request.getBedrooms() != null) apartment.setBedrooms(request.getBedrooms());
        if (request.getBathrooms() != null) apartment.setBathrooms(request.getBathrooms());
        if (request.getStatus() != null) {
            apartment.setStatus(Apartment.ApartmentStatus.valueOf(request.getStatus()));
        }
        
        apartment = apartmentRepository.save(apartment);
        log.info("Apartment updated: {} ({})", apartment.getUnitNumber(), apartment.getId());
        
        return mapToResponse(apartment);
    }
    
    @Transactional
    public void deleteApartment(String id) {
        Apartment apartment = apartmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Daire bulunamadı: " + id));
        
        apartment.setIsDeleted(true);
        apartmentRepository.save(apartment);
        log.info("Apartment deleted: {} ({})", apartment.getUnitNumber(), apartment.getId());
    }
    
    private ApartmentResponse mapToResponse(Apartment apartment) {
        ApartmentResponse response = new ApartmentResponse();
        response.setId(apartment.getId());
        response.setBlockId(apartment.getBlockId());
        
        // Get block name
        blockRepository.findById(apartment.getBlockId()).ifPresent(block -> {
            response.setBlockName(block.getName());
        });
        
        response.setUnitNumber(apartment.getUnitNumber());
        response.setFloor(apartment.getFloor());
        response.setUnitType(apartment.getUnitType());
        response.setArea(apartment.getArea());
        response.setBedrooms(apartment.getBedrooms());
        response.setBathrooms(apartment.getBathrooms());
        response.setStatus(apartment.getStatus().name());
        response.setOwnerUserId(apartment.getOwnerUserId());
        response.setCurrentResidentId(apartment.getCurrentResidentId());
        
        // Get owner name
        if (apartment.getOwnerUserId() != null) {
            userRepository.findById(apartment.getOwnerUserId()).ifPresent(user -> {
                response.setOwnerName(user.getFullName());
                response.setOwnerEmail(user.getEmail());
                response.setOwnerPhone(user.getPhone());
            });
        }
        
        // Get resident name
        if (apartment.getCurrentResidentId() != null) {
            userRepository.findById(apartment.getCurrentResidentId()).ifPresent(user -> {
                response.setCurrentResidentName(user.getFullName());
                response.setCurrentResidentEmail(user.getEmail());
                response.setCurrentResidentPhone(user.getPhone());
            });
        }
        
        response.setCreatedAt(apartment.getCreatedAt());
        response.setUpdatedAt(apartment.getUpdatedAt());
        return response;
    }
    
    private ApartmentResponse mapToResponseWithResidents(Apartment apartment) {
        ApartmentResponse response = mapToResponse(apartment);
        
        List<ApartmentResponse.ResidentInfo> residents = new ArrayList<>();
        java.util.Set<String> addedUserIds = new java.util.HashSet<>();
        
        if (apartment.getOwnerUserId() != null && !apartment.getOwnerUserId().isEmpty()) {
            userRepository.findById(apartment.getOwnerUserId()).ifPresent(user -> {
                response.setOwnerUserId(user.getId());
                response.setOwnerName(user.getFullName());
                response.setOwnerEmail(user.getEmail());
                response.setOwnerPhone(user.getPhone());
                
                // Add owner to residents array
                ApartmentResponse.ResidentInfo ownerInfo = new ApartmentResponse.ResidentInfo();
                ownerInfo.setId(user.getId());
                ownerInfo.setFullName(user.getFullName());
                ownerInfo.setEmail(user.getEmail());
                ownerInfo.setPhone(user.getPhone());
                ownerInfo.setResidentType("owner");
                residents.add(ownerInfo);
                addedUserIds.add(user.getId());
            });
        }
        
        if (apartment.getCurrentResidentId() != null && !apartment.getCurrentResidentId().isEmpty()) {
            // Only add tenant if different from owner
            boolean isDifferentFromOwner = apartment.getOwnerUserId() == null || 
                                          !apartment.getCurrentResidentId().equals(apartment.getOwnerUserId());
            
            if (isDifferentFromOwner) {
                userRepository.findById(apartment.getCurrentResidentId()).ifPresent(user -> {
                    response.setCurrentResidentId(user.getId());
                    response.setCurrentResidentName(user.getFullName());
                    response.setCurrentResidentEmail(user.getEmail());
                    response.setCurrentResidentPhone(user.getPhone());
                    
                    // Add tenant to residents array
                    ApartmentResponse.ResidentInfo tenantInfo = new ApartmentResponse.ResidentInfo();
                    tenantInfo.setId(user.getId());
                    tenantInfo.setFullName(user.getFullName());
                    tenantInfo.setEmail(user.getEmail());
                    tenantInfo.setPhone(user.getPhone());
                    tenantInfo.setResidentType("tenant");
                    residents.add(tenantInfo);
                    addedUserIds.add(user.getId());
                });
            }
        }

        // The real source of occupancy is residency_history. Some apartments have
        // historical/current resident fields empty, while admin screens still show
        // residents through active residency rows.
        userRepository.findByApartmentId(apartment.getId()).forEach(user -> {
            if (user == null || addedUserIds.contains(user.getId())) {
                return;
            }

            ApartmentResponse.ResidentInfo residentInfo = new ApartmentResponse.ResidentInfo();
            residentInfo.setId(user.getId());
            residentInfo.setFullName(user.getFullName());
            residentInfo.setEmail(user.getEmail());
            residentInfo.setPhone(user.getPhone());

            Boolean isOwner = userRepository.getIsOwnerByUserAndApartment(user.getId(), apartment.getId());
            residentInfo.setResidentType(Boolean.TRUE.equals(isOwner) ? "owner" : "tenant");

            residents.add(residentInfo);
            addedUserIds.add(user.getId());
        });
        
        // Set resident count and residents array
        response.setResidentCount(residents.size());
        response.setResidents(residents);
        
        return response;
    }

    private List<Apartment> dedupeByUnitNumberPreserveOrder(List<Apartment> apartments) {
        if (apartments == null || apartments.size() <= 1) return apartments;

        Map<String, Apartment> byUnit = new LinkedHashMap<>();
        int duplicates = 0;
        for (Apartment apt : apartments) {
            if (apt == null) continue;
            String key = normalizeUnitNumber(apt.getUnitNumber());
            // unitNumber boşsa düşürmeyelim
            if (key.isEmpty()) {
                byUnit.putIfAbsent("__empty__:" + Objects.toString(apt.getId(), ""), apt);
                continue;
            }
            if (byUnit.containsKey(key)) {
                duplicates++;
                continue;
            }
            byUnit.put(key, apt);
        }

        if (duplicates > 0) {
            log.warn("Duplicate apartments detected (blockId only): removed {} duplicates from {} rows", duplicates, apartments.size());
        }
        return new ArrayList<>(byUnit.values());
    }

    private List<Apartment> dedupeByBlockAndUnitNumberPreserveOrder(List<Apartment> apartments) {
        if (apartments == null || apartments.size() <= 1) return apartments;

        Map<String, Apartment> byKey = new LinkedHashMap<>();
        int duplicates = 0;
        for (Apartment apt : apartments) {
            if (apt == null) continue;
            String blockId = Objects.toString(apt.getBlockId(), "");
            String unit = normalizeUnitNumber(apt.getUnitNumber());
            String key = blockId + "::" + unit;
            if (unit.isEmpty()) {
                // unit boşsa id ile ayır
                key = blockId + "::__empty__:" + Objects.toString(apt.getId(), "");
            }
            if (byKey.containsKey(key)) {
                duplicates++;
                continue;
            }
            byKey.put(key, apt);
        }

        if (duplicates > 0) {
            log.warn("Duplicate apartments detected (blockId+unitNumber): removed {} duplicates from {} rows", duplicates, apartments.size());
        }
        return new ArrayList<>(byKey.values());
    }

    private String normalizeUnitNumber(String unitNumber) {
        if (unitNumber == null) return "";
        String raw = unitNumber.trim().toLowerCase();
        if (raw.isEmpty()) return "";

        // If numeric, normalize leading zeros (e.g., "01" -> "1")
        if (raw.matches("^\\d+$")) {
            try {
                return String.valueOf(Integer.parseInt(raw));
            } catch (NumberFormatException ignored) {
                // fall back to raw
            }
        }

        // Collapse multiple spaces for safety
        return raw.replaceAll("\\s+", " ");
    }
}
