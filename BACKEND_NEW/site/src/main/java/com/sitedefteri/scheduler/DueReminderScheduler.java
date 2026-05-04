package com.sitedefteri.scheduler;

import com.sitedefteri.entity.Due;
import com.sitedefteri.repository.DueRepository;
import com.sitedefteri.repository.UserFcmTokenRepository;
import com.sitedefteri.service.FirebaseMessagingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Due Reminder Scheduler - Otomatik aidat hatırlatma
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DueReminderScheduler {
    
    private final DueRepository dueRepository;
    private final UserFcmTokenRepository fcmTokenRepository;
    private final FirebaseMessagingService messagingService;
    
    /**
     * Her gün saat 10:00'da çalışır
     * Ödeme tarihine 3 gün veya daha az kalan ÖDENMEMİŞ aidatlar için bildirim gönderir
     * Ödeme yapılana kadar her gün 1 kere bildirim gider
     */
    @Scheduled(cron = "0 0 10 * * ?")
    public void sendDueReminders() {
        log.info("🔔 Due reminder job started");
        
        try {
            LocalDate today = LocalDate.now();
            LocalDate threeDaysLater = today.plusDays(3);
            
            // Ödeme tarihine 3 gün veya daha az kalan ÖDENMEMİŞ aidatları bul
            List<Due> upcomingDues = dueRepository.findAll().stream()
                .filter(due -> due.getStatus() == Due.DueStatus.bekliyor) // Sadece ödenmemiş
                .filter(due -> {
                    LocalDate dueDate = due.getDueDate();
                    // Bugünden itibaren 3 gün içinde vadesi dolacak aidatlar
                    return !dueDate.isBefore(today) && !dueDate.isAfter(threeDaysLater);
                })
                .toList();
            
            log.info("Found {} unpaid dues with 3 days or less remaining", upcomingDues.size());
            
            for (Due due : upcomingDues) {
                sendDueReminder(due);
            }
            
            log.info("✅ Due reminder job completed - {} reminders sent", upcomingDues.size());
        } catch (Exception e) {
            log.error("❌ Due reminder job failed: {}", e.getMessage());
        }
    }
    
    private void sendDueReminder(Due due) {
        try {
            String fcmToken = fcmTokenRepository
                .findByUserId(due.getApartmentId())
                .map(t -> t.getFcmToken())
                .orElse(null);
            
            if (fcmToken == null) {
                log.warn("No FCM token for apartment: {}", due.getApartmentId());
                return;
            }
            
            // Kalan gün sayısını hesapla
            LocalDate today = LocalDate.now();
            LocalDate dueDate = due.getDueDate();
            long daysRemaining = java.time.temporal.ChronoUnit.DAYS.between(today, dueDate);
            
            String title = "💰 Aidat Hatırlatması";
            String body;
            
            if (daysRemaining == 0) {
                body = String.format(
                    "Aidatınızı ödeyin! %s TL aidat borcunuz BUGÜN sona eriyor. Son gün!",
                    due.getTotalAmount()
                );
            } else if (daysRemaining == 1) {
                body = String.format(
                    "Aidatınızı ödeyin! %s TL aidat borcunuz YARIN (%s) sona eriyor. Son 1 gün!",
                    due.getTotalAmount(),
                    dueDate
                );
            } else {
                body = String.format(
                    "Aidatınızı ödeyin! %s TL aidat borcunuz %s tarihinde sona eriyor. Son %d gün!",
                    due.getTotalAmount(),
                    dueDate,
                    daysRemaining
                );
            }
            
            Map<String, String> data = Map.of(
                "type", "DUE_REMINDER",
                "dueId", due.getId(),
                "amount", due.getTotalAmount().toString(),
                "daysRemaining", String.valueOf(daysRemaining)
            );
            
            messagingService.sendToUser(fcmToken, title, body, data);
            log.info("✅ Reminder sent for due: {} - {} days remaining", due.getId(), daysRemaining);
        } catch (Exception e) {
            log.error("Failed to send reminder for due {}: {}", due.getId(), e.getMessage());
        }
    }
}
