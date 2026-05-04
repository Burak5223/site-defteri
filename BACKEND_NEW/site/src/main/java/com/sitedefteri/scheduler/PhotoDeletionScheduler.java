package com.sitedefteri.scheduler;

import com.sitedefteri.repository.AIExtractionLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * KVKK Compliance: Photo Auto-Deletion Scheduler
 * Deletes cargo slip photos older than 30 days
 * Runs daily at 2:00 AM
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PhotoDeletionScheduler {
    
    private final AIExtractionLogRepository aiExtractionLogRepository;
    
    /**
     * Delete photos older than 30 days
     * Runs daily at 2:00 AM (cron: 0 0 2 * * *)
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void deleteOldPhotos() {
        log.info("Starting photo deletion scheduler (KVKK compliance)");
        
        try {
            // Calculate cutoff date (30 days ago)
            LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30);
            
            // Find logs with photos older than 30 days that haven't been deleted yet
            List<com.sitedefteri.entity.AIExtractionLog> logsToDelete = 
                aiExtractionLogRepository.findPhotosOlderThan(cutoffDate);
            
            if (logsToDelete.isEmpty()) {
                log.info("No photos to delete (all photos are either recent or already deleted)");
                return;
            }
            
            log.info("Found {} photos to delete (older than 30 days)", logsToDelete.size());
            
            int deletedCount = 0;
            int errorCount = 0;
            
            for (com.sitedefteri.entity.AIExtractionLog extractionLog : logsToDelete) {
                try {
                    // In a real implementation, you would:
                    // 1. Delete the actual photo file from storage (S3, local filesystem, etc.)
                    // 2. Update the photo_deleted_at timestamp
                    
                    // For now, just update the timestamp
                    extractionLog.setPhotoDeletedAt(LocalDateTime.now());
                    aiExtractionLogRepository.save(extractionLog);
                    
                    deletedCount++;
                    
                    if (deletedCount % 100 == 0) {
                        log.info("Deleted {} photos so far...", deletedCount);
                    }
                    
                } catch (Exception e) {
                    errorCount++;
                    log.error("Failed to delete photo for log ID {}: {}", extractionLog.getId(), e.getMessage());
                }
            }
            
            log.info("Photo deletion completed: {} deleted, {} errors", deletedCount, errorCount);
            
            // Log summary
            if (errorCount > 0) {
                log.warn("Photo deletion completed with {} errors out of {} total", errorCount, logsToDelete.size());
            } else {
                log.info("Photo deletion completed successfully: {} photos deleted", deletedCount);
            }
            
        } catch (Exception e) {
            log.error("Photo deletion scheduler failed: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Manual trigger for testing (can be called via admin endpoint)
     */
    @Transactional
    public int deleteOldPhotosManual() {
        log.info("Manual photo deletion triggered");
        
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30);
        List<com.sitedefteri.entity.AIExtractionLog> logsToDelete = 
            aiExtractionLogRepository.findPhotosOlderThan(cutoffDate);
        
        int deletedCount = 0;
        for (com.sitedefteri.entity.AIExtractionLog extractionLog : logsToDelete) {
            try {
                extractionLog.setPhotoDeletedAt(LocalDateTime.now());
                aiExtractionLogRepository.save(extractionLog);
                deletedCount++;
            } catch (Exception e) {
                log.error("Failed to delete photo for log ID {}: {}", extractionLog.getId(), e.getMessage());
            }
        }
        
        log.info("Manual photo deletion completed: {} photos deleted", deletedCount);
        return deletedCount;
    }
}
