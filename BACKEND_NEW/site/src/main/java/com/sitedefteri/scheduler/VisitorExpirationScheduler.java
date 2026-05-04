package com.sitedefteri.scheduler;

import com.sitedefteri.entity.Visitor;
import com.sitedefteri.repository.VisitorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Ziyaretçilerin kalış süresi bitince otomatik olarak pasif yapan scheduler
 * Her 1 saatte bir çalışır
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class VisitorExpirationScheduler {
    
    private final VisitorRepository visitorRepository;
    
    /**
     * Süresi dolan ziyaretçileri pasif yap
     * Her saat başı çalışır (cron: 0 0 * * * *)
     */
    @Scheduled(cron = "0 0 * * * *") // Her saat başı
    @Transactional
    public void deactivateExpiredVisitors() {
        try {
            log.info("Starting visitor expiration check...");
            
            LocalDateTime now = LocalDateTime.now();
            
            // Aktif olan ve süresi dolmuş ziyaretçileri bul
            List<Visitor> expiredVisitors = visitorRepository.findActiveExpiredVisitors(now);
            
            if (expiredVisitors.isEmpty()) {
                log.info("No expired visitors found");
                return;
            }
            
            log.info("Found {} expired visitors", expiredVisitors.size());
            
            // Hepsini pasif yap
            int deactivatedCount = 0;
            for (Visitor visitor : expiredVisitors) {
                visitor.setIsActive(false);
                visitorRepository.save(visitor);
                deactivatedCount++;
                
                log.debug("Deactivated visitor: {} (Name: {}, Stay end: {})", 
                        visitor.getId(), 
                        visitor.getVisitorName(), 
                        visitor.getStayEndDate());
            }
            
            log.info("Successfully deactivated {} expired visitors", deactivatedCount);
            
        } catch (Exception e) {
            log.error("Error while deactivating expired visitors", e);
        }
    }
    
    /**
     * Test için: Her 5 dakikada bir çalışan versiyon (geliştirme ortamı için)
     * Production'da bu metodu kaldırabilir veya devre dışı bırakabilirsiniz
     */
    // @Scheduled(fixedRate = 300000) // 5 dakika = 300000 ms
    @Transactional
    public void deactivateExpiredVisitorsFrequent() {
        deactivateExpiredVisitors();
    }
}
