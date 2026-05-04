package com.sitedefteri.service;

import com.sitedefteri.dto.request.CreateApartmentRequest;
import com.sitedefteri.dto.response.ApartmentResponse;
import com.sitedefteri.entity.Apartment;
import com.sitedefteri.entity.Block;
import com.sitedefteri.entity.User;
import com.sitedefteri.exception.ResourceNotFoundException;
import com.sitedefteri.repository.ApartmentRepository;
import com.sitedefteri.repository.BlockRepository;
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
public class ApartmentService {
    
    private final ApartmentRepository apartmentRepository;
    private final BlockRepository blockRepository;
    private final UserRepository userRepository;
    
    @Transactional(readOnly = true)
    public List<ApartmentResponse> getApartmentsByBlock(String blockId) {
        return apartmentRepository.findByBlockId(blockId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ApartmentResponse> getApartmentsBySite(String siteId) {
        log.info("Fetching apartments for site: {}", siteId);
        // Get all blocks for this site
        List<Block> blocks = blockRepository.findBySiteId(siteId);
        
        // Get all apartments for these blocks
        return blocks.stream()
                .flatMap(block -> apartmentRepository.findByBlockId(block.getId()).stream())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
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
        Block block = blockRepository.findById(blockId)
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
            });
        }
        
        // Get resident name
        if (apartment.getCurrentResidentId() != null) {
            userRepository.findById(apartment.getCurrentResidentId()).ifPresent(user -> {
                response.setCurrentResidentName(user.getFullName());
            });
        }
        
        response.setCreatedAt(apartment.getCreatedAt());
        response.setUpdatedAt(apartment.getUpdatedAt());
        return response;
    }
}
