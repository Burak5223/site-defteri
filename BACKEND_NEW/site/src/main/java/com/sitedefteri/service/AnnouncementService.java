package com.sitedefteri.service;

import com.sitedefteri.dto.request.CreateAnnouncementRequest;
import com.sitedefteri.dto.response.AnnouncementResponse;
import com.sitedefteri.entity.Announcement;
import com.sitedefteri.repository.AnnouncementRepository;
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
public class AnnouncementService {
    
    private final AnnouncementRepository announcementRepository;
    
    @Transactional(readOnly = true)
    public List<AnnouncementResponse> getAnnouncementsBySite(String siteId) {
        log.info("Fetching announcements for site: {}", siteId);
        return announcementRepository.findBySiteIdOrderByPublishedAtDesc(siteId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public AnnouncementResponse getAnnouncementById(String announcementId) {
        log.info("Fetching announcement: {}", announcementId);
        Announcement announcement = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new RuntimeException("Duyuru bulunamadı: " + announcementId));
        return toResponse(announcement);
    }
    
    @Transactional
    public AnnouncementResponse createAnnouncement(CreateAnnouncementRequest request, String siteId, String userId) {
        log.info("Creating announcement for site: {}", siteId);
        
        Announcement announcement = new Announcement();
        announcement.setSiteId(siteId);
        announcement.setTitle(request.getTitle());
        announcement.setBody(request.getContent());
        announcement.setCreatedBy(userId);
        announcement.setPublishedAt(LocalDateTime.now());
        
        if (request.getPriority() != null) {
            try {
                // Convert to lowercase to match enum
                String priorityLower = request.getPriority().toLowerCase();
                announcement.setPriority(Announcement.Priority.valueOf(priorityLower));
            } catch (IllegalArgumentException e) {
                log.warn("Invalid priority value: {}, using default", request.getPriority());
                announcement.setPriority(Announcement.Priority.orta);
            }
        }
        
        Announcement saved = announcementRepository.save(announcement);
        log.info("Announcement created with ID: {}", saved.getId());
        return toResponse(saved);
    }
    
    @Transactional
    public AnnouncementResponse updateAnnouncement(String announcementId, CreateAnnouncementRequest request) {
        log.info("Updating announcement: {}", announcementId);
        
        Announcement announcement = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new RuntimeException("Duyuru bulunamadı: " + announcementId));
        
        if (request.getTitle() != null) {
            announcement.setTitle(request.getTitle());
        }
        if (request.getContent() != null) {
            announcement.setBody(request.getContent());
        }
        if (request.getPriority() != null) {
            try {
                announcement.setPriority(Announcement.Priority.valueOf(request.getPriority().toLowerCase()));
            } catch (IllegalArgumentException e) {
                log.warn("Invalid priority value: {}", request.getPriority());
            }
        }
        
        Announcement updated = announcementRepository.save(announcement);
        log.info("Announcement updated: {}", announcementId);
        return toResponse(updated);
    }
    
    @Transactional
    public void deleteAnnouncement(String announcementId) {
        log.info("Deleting announcement: {}", announcementId);
        
        Announcement announcement = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new RuntimeException("Duyuru bulunamadı: " + announcementId));
        
        announcementRepository.delete(announcement);
        log.info("Announcement deleted: {}", announcementId);
    }
    
    @Transactional
    public AnnouncementResponse publishAnnouncement(String announcementId) {
        log.info("Publishing announcement: {}", announcementId);
        
        Announcement announcement = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new RuntimeException("Duyuru bulunamadı: " + announcementId));
        
        announcement.setPublishedAt(LocalDateTime.now());
        Announcement updated = announcementRepository.save(announcement);
        
        log.info("Announcement published: {}", announcementId);
        return toResponse(updated);
    }
    
    private AnnouncementResponse toResponse(Announcement announcement) {
        AnnouncementResponse response = new AnnouncementResponse();
        response.setId(announcement.getId());
        response.setTitle(announcement.getTitle());
        response.setContent(announcement.getBody());
        response.setPriority(announcement.getPriority().name());
        response.setPublishedAt(announcement.getPublishedAt());
        response.setCreatedAt(announcement.getCreatedAt());
        return response;
    }
}
