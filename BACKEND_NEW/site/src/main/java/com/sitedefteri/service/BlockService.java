package com.sitedefteri.service;

import com.sitedefteri.dto.request.CreateBlockRequest;
import com.sitedefteri.dto.response.BlockResponse;
import com.sitedefteri.entity.Block;
import com.sitedefteri.exception.ResourceNotFoundException;
import com.sitedefteri.repository.ApartmentRepository;
import com.sitedefteri.repository.BlockRepository;
import com.sitedefteri.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BlockService {
    
    private final BlockRepository blockRepository;
    private final ApartmentRepository apartmentRepository;
    
    @Autowired
    private SecurityUtils securityUtils;
    
    @Transactional(readOnly = true)
    public List<BlockResponse> getBlocksBySite(String siteId) {
        return blockRepository.findBySiteIdAndIsDeletedFalseOrderByNameAsc(siteId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public BlockResponse getBlockById(String id) {
        Block block = blockRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Blok bulunamadı: " + id));
        return mapToResponse(block);
    }
    
    @Transactional
    public BlockResponse createBlock(String siteId, CreateBlockRequest request) {
        // Use the siteId from the path parameter instead of current user's siteId
        Block block = new Block();
        block.setSiteId(siteId);
        block.setName(request.getName());
        block.setDescription(request.getDescription());
        block.setTotalFloors(request.getTotalFloors());
        
        block = blockRepository.save(block);
        log.info("Block created: {} in site {} ({})", block.getName(), siteId, block.getId());
        
        return mapToResponse(block);
    }
    
    @Transactional
    public BlockResponse updateBlock(String id, CreateBlockRequest request) {
        Block block = blockRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Blok bulunamadı: " + id));
        
        if (request.getName() != null) block.setName(request.getName());
        if (request.getDescription() != null) block.setDescription(request.getDescription());
        if (request.getTotalFloors() != null) block.setTotalFloors(request.getTotalFloors());
        
        block = blockRepository.save(block);
        log.info("Block updated: {} ({})", block.getName(), block.getId());
        
        return mapToResponse(block);
    }
    
    @Transactional
    public void deleteBlock(String id) {
        Block block = blockRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Blok bulunamadı: " + id));
        
        block.setIsDeleted(true);
        blockRepository.save(block);
        log.info("Block deleted: {} ({})", block.getName(), block.getId());
    }
    
    private BlockResponse mapToResponse(Block block) {
        BlockResponse response = new BlockResponse();
        response.setId(block.getId());
        response.setSiteId(block.getSiteId());
        response.setName(block.getName());
        response.setDescription(block.getDescription());
        response.setTotalFloors(block.getTotalFloors());
        
        // Get all apartments in this block (excluding deleted ones)
        var apartments = apartmentRepository.findByBlockId(block.getId());
        response.setTotalApartments(apartments.size());
        
        log.debug("Block {} has {} apartments", block.getName(), apartments.size());
        
        // Count owners and tenants correctly
        int ownerCount = 0;
        int tenantCount = 0;
        int totalResidents = 0;
        
        for (var apt : apartments) {
            boolean hasOwner = apt.getOwnerUserId() != null && !apt.getOwnerUserId().isEmpty();
            boolean hasCurrentResident = apt.getCurrentResidentId() != null && !apt.getCurrentResidentId().isEmpty();
            
            if (hasOwner) {
                ownerCount++;
                totalResidents++; // Owner is always a resident
            }
            
            // Tenant is only counted if current resident is different from owner
            if (hasCurrentResident && (!hasOwner || !apt.getCurrentResidentId().equals(apt.getOwnerUserId()))) {
                tenantCount++;
                totalResidents++; // Tenant is an additional resident
            }
        }
        
        response.setTotalOwners(ownerCount);
        response.setTotalTenants(tenantCount);
        response.setTotalResidents(totalResidents);
        
        log.info("Block {} - Apartments: {}, Owners: {}, Tenants: {}, Total Residents: {}", 
                 block.getName(), apartments.size(), ownerCount, tenantCount, totalResidents);
        
        response.setCreatedAt(block.getCreatedAt());
        response.setUpdatedAt(block.getUpdatedAt());
        return response;
    }
}
