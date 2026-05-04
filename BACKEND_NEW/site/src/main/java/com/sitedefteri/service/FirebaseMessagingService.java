package com.sitedefteri.service;

import com.google.firebase.messaging.*;
import com.sitedefteri.entity.NotificationHistory;
import com.sitedefteri.repository.NotificationHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Firebase Cloud Messaging Service
 * 
 * Push notification gönderme servisi
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FirebaseMessagingService {
    
    private final NotificationHistoryRepository notificationHistoryRepository;
    
    /**
     * Tek kullanıcıya bildirim gönder
     */
    public void sendToUser(String fcmToken, String title, String body, 
                          Map<String, String> data) {
        log.info("📱 Sending notification to user - Title: {}", title);
        
        try {
            // Firebase Cloud Messaging ile bildirim gönder
            Message message = Message.builder()
                .setToken(fcmToken)
                .setNotification(Notification.builder()
                    .setTitle(title)
                    .setBody(body)
                    .build())
                .putAllData(data != null ? data : Map.of())
                .setAndroidConfig(AndroidConfig.builder()
                    .setPriority(AndroidConfig.Priority.HIGH)
                    .setNotification(AndroidNotification.builder()
                        .setSound("default")
                        .setColor("#4CAF50")
                        .build())
                    .build())
                .setApnsConfig(ApnsConfig.builder()
                    .setAps(Aps.builder()
                        .setSound("default")
                        .build())
                    .build())
                .build();

            String response = FirebaseMessaging.getInstance().send(message);
            log.info("✅ Notification sent successfully: {}", response);
            
            // Bildirim geçmişine kaydet
            saveNotificationHistory(null, title, body, 
                data != null ? data.get("type") : null, 
                "SUCCESS: " + response);
            
        } catch (Exception e) {
            log.error("❌ Failed to send notification: {}", e.getMessage());
            
            // Hata durumunda da kaydet
            saveNotificationHistory(null, title, body, 
                data != null ? data.get("type") : null, 
                "ERROR: " + e.getMessage());
        }
    }
    
    /**
     * Topic'e bildirim gönder (Toplu)
     */
    public void sendToTopic(String topic, String title, String body) {
        log.info("📢 Sending notification to topic: {} - Title: {}", topic, title);
        
        try {
            // Firebase Cloud Messaging ile topic'e bildirim gönder
            Message message = Message.builder()
                .setTopic(topic)
                .setNotification(Notification.builder()
                    .setTitle(title)
                    .setBody(body)
                    .build())
                .build();

            String response = FirebaseMessaging.getInstance().send(message);
            log.info("✅ Topic notification sent: {}", response);
            
            // Bildirim geçmişine kaydet
            saveNotificationHistory(null, title, body, "TOPIC_" + topic, "SUCCESS: " + response);
            
        } catch (Exception e) {
            log.error("❌ Failed to send topic notification: {}", e.getMessage());
            saveNotificationHistory(null, title, body, "TOPIC_" + topic, "ERROR: " + e.getMessage());
        }
    }
    
    /**
     * Çoklu kullanıcıya bildirim gönder
     */
    public void sendToMultipleUsers(List<String> fcmTokens, String title, String body) {
        log.info("📱 Sending notification to {} users - Title: {}", fcmTokens.size(), title);
        
        try {
            // Firebase Cloud Messaging ile multicast gönder
            MulticastMessage message = MulticastMessage.builder()
                .addAllTokens(fcmTokens)
                .setNotification(Notification.builder()
                    .setTitle(title)
                    .setBody(body)
                    .build())
                .build();

            BatchResponse response = FirebaseMessaging.getInstance()
                .sendMulticast(message);
            
            log.info("✅ Sent {} notifications, {} successful, {} failed",
                fcmTokens.size(), response.getSuccessCount(), response.getFailureCount());
            
            // Bildirim geçmişine kaydet
            saveNotificationHistory(null, title, body, "MULTICAST", 
                String.format("Success: %d, Failed: %d", response.getSuccessCount(), response.getFailureCount()));
                
        } catch (Exception e) {
            log.error("❌ Failed to send multicast: {}", e.getMessage());
            saveNotificationHistory(null, title, body, "MULTICAST", "ERROR: " + e.getMessage());
        }
    }
    
    /**
     * Bildirim geçmişine kaydet
     */
    private void saveNotificationHistory(String userId, String title, String body, 
                                        String type, String data) {
        try {
            NotificationHistory history = new NotificationHistory();
            history.setUserId(userId);
            history.setTitle(title);
            history.setBody(body);
            history.setType(type);
            history.setData(data);
            
            notificationHistoryRepository.save(history);
            log.debug("✅ Notification saved to history");
        } catch (Exception e) {
            log.error("❌ Failed to save notification history: {}", e.getMessage());
        }
    }
}
