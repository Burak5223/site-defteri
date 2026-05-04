package com.sitedefteri.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sitedefteri.dto.request.CreateSiteRequest;
import com.sitedefteri.dto.request.UpdateSiteRequest;
import com.sitedefteri.dto.response.SiteResponse;
import com.sitedefteri.entity.Site;
import com.sitedefteri.exception.ResourceNotFoundException;
import com.sitedefteri.exception.BadRequestException;
import com.sitedefteri.repository.SiteRepository;
import com.sitedefteri.repository.ApartmentRepository;
import com.sitedefteri.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SiteService {
    
    private final SiteRepository siteRepository;
    private final ApartmentRepository apartmentRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    
    @Transactional(readOnly = true)
    public List<SiteResponse> getAllSites() {
        return siteRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public SiteResponse getSiteById(String id) {
        Site site = siteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Site not found with id: " + id));
        return toResponse(site);
    }
    
    @Transactional
    public SiteResponse createSite(CreateSiteRequest request) {
        Site site = new Site();
        site.setName(request.getName());
        site.setAddress(request.getAddress());
        site.setCity(request.getCity());
        site.setPostalCode(request.getPostalCode());
        // Note: phone, email, taxNumber, taxOffice, description not in Site entity
        
        site = siteRepository.save(site);
        log.info("Site created: {} ({})", site.getName(), site.getId());
        
        return toResponse(site);
    }
    
    @Transactional
    public SiteResponse updateSite(String id, UpdateSiteRequest request) {
        Site site = siteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Site not found with id: " + id));
        
        if (request.getName() != null) site.setName(request.getName());
        if (request.getAddress() != null) site.setAddress(request.getAddress());
        if (request.getCity() != null) site.setCity(request.getCity());
        if (request.getPostalCode() != null) site.setPostalCode(request.getPostalCode());
        // Note: phone, email, taxNumber, taxOffice, description not in Site entity
        
        site = siteRepository.save(site);
        log.info("Site updated: {} ({})", site.getName(), site.getId());
        
        return toResponse(site);
    }
    
    @Transactional
    public void deleteSite(String id) {
        Site site = siteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Site not found with id: " + id));
        
        site.setIsDeleted(true);
        siteRepository.save(site);
        log.info("Site deleted: {} ({})", site.getName(), site.getId());
    }
    
    @Transactional(readOnly = true)
    public Map<String, Object> getSiteSettings(String id) {
        Site site = siteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Site not found with id: " + id));
        
        Map<String, Object> settings = new HashMap<>();
        
        // Parse JSON settings if exists
        if (site.getSettings() != null && !site.getSettings().isEmpty()) {
            try {
                settings = objectMapper.readValue(site.getSettings(), Map.class);
            } catch (JsonProcessingException e) {
                log.error("Error parsing site settings JSON", e);
            }
        }
        
        // Add basic site info
        settings.put("siteId", site.getId());
        settings.put("siteName", site.getName());
        settings.put("timezone", site.getTimezone());
        settings.put("logoUrl", site.getLogoUrl());
        
        log.info("Retrieved settings for site: {}", id);
        return settings;
    }
    
    @Transactional
    public Map<String, Object> updateSiteSettings(String id, Map<String, Object> newSettings) {
        Site site = siteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Site not found with id: " + id));
        
        // Get existing settings
        Map<String, Object> existingSettings = new HashMap<>();
        if (site.getSettings() != null && !site.getSettings().isEmpty()) {
            try {
                existingSettings = objectMapper.readValue(site.getSettings(), Map.class);
            } catch (JsonProcessingException e) {
                log.error("Error parsing existing site settings JSON", e);
            }
        }
        
        // Merge with new settings
        existingSettings.putAll(newSettings);
        
        // Update basic fields if provided
        if (newSettings.containsKey("timezone")) {
            site.setTimezone((String) newSettings.get("timezone"));
        }
        if (newSettings.containsKey("logoUrl")) {
            site.setLogoUrl((String) newSettings.get("logoUrl"));
        }
        
        // Save settings as JSON
        try {
            String settingsJson = objectMapper.writeValueAsString(existingSettings);
            site.setSettings(settingsJson);
        } catch (JsonProcessingException e) {
            log.error("Error converting settings to JSON", e);
            throw new BadRequestException("Invalid settings format");
        }
        
        siteRepository.save(site);
        log.info("Updated settings for site: {}", id);
        
        return existingSettings;
    }
    
    private SiteResponse toResponse(Site site) {
        SiteResponse response = new SiteResponse();
        response.setId(site.getId());
        response.setName(site.getName());
        response.setAddress(site.getAddress());
        response.setCity(site.getCity());
        response.setCountry(site.getCountry());
        response.setPostalCode(site.getPostalCode());
        response.setSubscriptionStatus(site.getSubscriptionStatus());
        response.setSubscriptionExpiry(site.getSubscriptionExpiry());
        response.setLogoUrl(site.getLogoUrl());
        response.setTimezone(site.getTimezone());
        response.setCreatedAt(site.getCreatedAt());
        response.setUpdatedAt(site.getUpdatedAt());
        
        // Toplam daire sayısı
        long totalApartments = apartmentRepository.countBySiteId(site.getId());
        response.setTotalApartments((int) totalApartments);
        
        // Toplam sakin sayısı (aktif kullanıcılar)
        long totalResidents = userRepository.findBySiteId(site.getId()).size();
        response.setTotalResidents((int) totalResidents);
        
        return response;
    }
}
