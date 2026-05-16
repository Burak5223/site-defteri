package com.sitedefteri.scheduler;

import com.sitedefteri.entity.Voting;
import com.sitedefteri.repository.VotingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class VotingExpirationScheduler {
    
    private final VotingRepository votingRepository;
    
    /**
     * Her 1 saatte bir çalışır ve süresi dolan oylamaları kapatır
     */
    @Scheduled(cron = "0 0 * * * *") // Her saat başı
    @Transactional
    public void closeExpiredVotings() {
        log.info("Checking for expired votings...");
        
        try {
            LocalDateTime now = LocalDateTime.now();
            
            // Aktif olan ve bitiş tarihi geçmiş oylamaları bul
            List<Voting> expiredVotings = votingRepository.findByStatusAndEndDateBefore("active", now);
            
            if (expiredVotings.isEmpty()) {
                log.info("No expired votings found");
                return;
            }
            
            log.info("Found {} expired votings", expiredVotings.size());
            
            // Durumlarını "completed" olarak güncelle
            for (Voting voting : expiredVotings) {
                voting.setStatus("completed");
                votingRepository.save(voting);
                log.info("Closed voting: {} (ID: {})", voting.getTitle(), voting.getId());
            }
            
            log.info("Successfully closed {} expired votings", expiredVotings.size());
            
        } catch (Exception e) {
            log.error("Error closing expired votings", e);
        }
    }
}
