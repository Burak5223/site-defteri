package com.sitedefteri.service;

import com.sitedefteri.dto.request.CreateMessageRequest;
import com.sitedefteri.dto.response.MessageResponse;
import com.sitedefteri.entity.Message;
import com.sitedefteri.entity.User;
import com.sitedefteri.exception.ResourceNotFoundException;
import com.sitedefteri.repository.MessageRepository;
import com.sitedefteri.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
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
public class MessageService {
    
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final com.sitedefteri.repository.ApartmentRepository apartmentRepository;
    
    @PersistenceContext
    private EntityManager entityManager;
    
    @Transactional
    public MessageResponse createMessage(CreateMessageRequest request, String senderId) {
        log.info("Creating message from user: {}, chatType: {}", senderId, request.getChatType());
        
        Message message = new Message();
        message.setSiteId(request.getSiteId());
        message.setSenderId(senderId);
        message.setReceiverId(request.getReceiverId());
        
        // ApartmentId'yi belirle
        String apartmentId = request.getApartmentId();
        log.info("Request apartmentId: {}", apartmentId);
        
        // Eğer apartmentId gönderilmemişse ve chatType 'security' veya 'apartment' ise,
        // kullanıcının apartmentId'sini otomatik olarak al
        if (apartmentId == null && ("security".equals(request.getChatType()) || "apartment".equals(request.getChatType()))) {
            apartmentId = getUserApartmentId(senderId);
            log.info("Auto-detected apartmentId for user {}: {}", senderId, apartmentId);
        }
        
        log.info("Final apartmentId to be saved: {}", apartmentId);
        message.setApartmentId(apartmentId);
        message.setChatType(request.getChatType());
        message.setBody(request.getBody());
        message.setIsRead(false);
        message.setAttachmentUrl(request.getAttachmentUrl());
        message.setAttachmentType(request.getAttachmentType());
        
        Message saved = messageRepository.save(message);
        log.info("Message created with ID: {}", saved.getId());
        
        return toResponse(saved);
    }
    
    /**
     * Kullanıcının apartmentId'sini residency_history tablosundan al
     */
    private String getUserApartmentId(String userId) {
        try {
            // Native query ile residency_history'den al
            // En son aktif residency kaydını al
            String query = "SELECT apartment_id FROM residency_history " +
                          "WHERE user_id = :userId AND status = 'active' " +
                          "ORDER BY move_in_date DESC LIMIT 1";
            
            Object result = entityManager.createNativeQuery(query)
                    .setParameter("userId", userId)
                    .getSingleResult();
            
            if (result != null) {
                String apartmentId = result.toString();
                log.info("Found apartment ID '{}' for user {}", apartmentId, userId);
                
                // Verify apartment exists
                var apartment = apartmentRepository.findById(apartmentId);
                if (apartment.isPresent()) {
                    log.info("Apartment {} verified in database", apartmentId);
                    return apartmentId;
                } else {
                    log.error("Apartment {} not found in apartments table!", apartmentId);
                    return null;
                }
            }
            
            log.warn("No active residency found for user {}", userId);
            return null;
        } catch (jakarta.persistence.NoResultException e) {
            log.warn("No active residency found for user {}", userId);
            return null;
        } catch (Exception e) {
            log.error("Error getting user apartment ID: {}", e.getMessage(), e);
            return null;
        }
    }
    
    public List<MessageResponse> getGroupMessages(String siteId) {
        log.info("Fetching group messages for site: {}", siteId);
        List<Message> messages = messageRepository.findBySiteIdAndChatTypeOrderByCreatedAtAsc(siteId, "group");
        return messages.stream().map(this::toResponse).collect(Collectors.toList());
    }
    
    public List<MessageResponse> getSiteMessages(String siteId, String userId) {
        log.info("Fetching all messages for site: {} and user: {}", siteId, userId);
        // Hem group, security, hem de apartment mesajlarını getir
        List<Message> groupMessages = messageRepository.findBySiteIdAndChatTypeOrderByCreatedAtAsc(siteId, "group");
        List<Message> securityMessages = messageRepository.findSecurityMessagesByUser(siteId);
        List<Message> apartmentMessages = messageRepository.findBySiteIdAndChatTypeOrderByCreatedAtAsc(siteId, "apartment");
        
        // Hepsini birleştir
        groupMessages.addAll(securityMessages);
        groupMessages.addAll(apartmentMessages);
        
        // Tarihe göre sırala
        return groupMessages.stream()
                .sorted((m1, m2) -> m2.getCreatedAt().compareTo(m1.getCreatedAt()))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    public List<MessageResponse> getSecurityMessages(String siteId, String userId, String otherUserId) {
        log.info("Fetching security messages between {} and {}", userId, otherUserId);
        List<Message> messages = messageRepository.findSecurityMessagesBetweenUsers(siteId, userId, otherUserId);
        return messages.stream().map(this::toResponse).collect(Collectors.toList());
    }
    
    public List<MessageResponse> getMySecurityMessages(String siteId, String userId) {
        log.info("Fetching all security messages for user: {}", userId);
        List<Message> messages = messageRepository.findSecurityMessagesByUser(siteId);
        return messages.stream().map(this::toResponse).collect(Collectors.toList());
    }
    
    @Transactional
    public void markAsRead(String messageId, String userId) {
        log.info("Marking message {} as read by user {}", messageId, userId);
        Message message = messageRepository.findById(Long.parseLong(messageId))
                .orElseThrow(() -> new ResourceNotFoundException("Mesaj", "id", messageId));
        
        if (message.getReceiverId() != null && message.getReceiverId().equals(userId)) {
            message.setIsRead(true);
            message.setReadAt(LocalDateTime.now());
            messageRepository.save(message);
        }
    }
    
    public long getUnreadCount(String userId) {
        return messageRepository.countUnreadByReceiverId(userId);
    }
    
    public List<MessageResponse> getMyMessages(String userId) {
        log.info("Fetching all messages for user: {}", userId);
        List<Message> messages = messageRepository.findAll().stream()
                .filter(m -> userId.equals(m.getSenderId()) || userId.equals(m.getReceiverId()))
                .collect(Collectors.toList());
        return messages.stream().map(this::toResponse).collect(Collectors.toList());
    }
    
    @Transactional
    public MessageResponse updateMessage(String messageId, String body) {
        log.info("Updating message: {}", messageId);
        
        Message message = messageRepository.findById(Long.parseLong(messageId))
                .orElseThrow(() -> new ResourceNotFoundException("Mesaj", "id", messageId));
        
        message.setBody(body);
        Message updated = messageRepository.save(message);
        
        log.info("Message updated: {}", messageId);
        return toResponse(updated);
    }
    
    @Transactional
    public void deleteMessage(String messageId) {
        log.info("Deleting message: {}", messageId);
        
        Message message = messageRepository.findById(Long.parseLong(messageId))
                .orElseThrow(() -> new ResourceNotFoundException("Mesaj", "id", messageId));
        
        messageRepository.delete(message);
        log.info("Message deleted: {}", messageId);
    }
    
    private MessageResponse toResponse(Message message) {
        User sender = userRepository.findById(message.getSenderId()).orElse(null);
        
        // Apartment bilgisini al
        String apartmentNumber = null;
        if (message.getApartmentId() != null) {
            try {
                var apartment = apartmentRepository.findById(message.getApartmentId());
                if (apartment.isPresent()) {
                    apartmentNumber = apartment.get().getUnitNumber();
                }
            } catch (Exception e) {
                log.warn("Could not fetch apartment info for message {}: {}", message.getId(), e.getMessage());
            }
        }
        
        return MessageResponse.builder()
                .id(String.valueOf(message.getId()))
                .siteId(message.getSiteId())
                .senderId(message.getSenderId())
                .senderName(sender != null ? sender.getFullName() : "Unknown")
                .senderRole(getUserRole(sender))
                .receiverId(message.getReceiverId())
                .apartmentId(message.getApartmentId())
                .apartmentNumber(apartmentNumber)
                .chatType(message.getChatType())
                .body(message.getBody())
                .isRead(message.getIsRead())
                .readAt(message.getReadAt())
                .attachmentUrl(message.getAttachmentUrl())
                .attachmentType(message.getAttachmentType())
                .createdAt(message.getCreatedAt())
                .build();
    }
    
    private String getUserRole(User user) {
        if (user == null) return "resident";
        // TODO: Get actual role from user_roles table
        // For now, return based on email
        if (user.getEmail().contains("admin")) return "admin";
        if (user.getEmail().contains("security")) return "security";
        return "resident";
    }
    
    /**
     * Sistem mesajı oluştur (bildirimler için)
     * Gönderen: SYSTEM
     */
    @Transactional
    public MessageResponse createSystemMessage(String receiverId, String body, String relatedType, String relatedId) {
        log.info("Creating system message for user: {}, type: {}", receiverId, relatedType);
        
        // Alıcı kullanıcıyı bul
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı", "id", receiverId));
        
        Message message = new Message();
        message.setSiteId("1"); // Default site ID - TODO: Get from receiver's apartment
        message.setSenderId(null); // Sistem mesajı (NULL sender)
        message.setReceiverId(receiverId);
        message.setChatType("notification"); // Bildirim tipi
        message.setBody(body);
        message.setIsRead(false);
        
        // İlişkili kayıt bilgisi (opsiyonel)
        if (relatedType != null && relatedId != null) {
            // Not: Message entity'de related_type ve related_id alanları yoksa eklenebilir
            // Şimdilik body içinde belirtiyoruz
        }
        
        Message saved = messageRepository.save(message);
        log.info("System message created with ID: {}", saved.getId());
        
        return toResponse(saved);
    }
    
    /**
     * Daire bazlı mesajları getir
     */
    public List<MessageResponse> getApartmentMessages(String siteId, String apartmentId) {
        log.info("Fetching apartment messages for site: {}, apartment: {}", siteId, apartmentId);
        List<Message> messages = messageRepository.findApartmentMessages(siteId, apartmentId);
        return messages.stream().map(this::toResponse).collect(Collectors.toList());
    }
    
    /**
     * Mesajı olan tüm daireleri getir
     */
    public List<String> getApartmentsWithMessages(String siteId) {
        log.info("Fetching apartments with messages for site: {}", siteId);
        return messageRepository.findApartmentsWithMessages(siteId);
    }
    
    /**
     * Mesajlaşma için daire listesini getir
     */
    public List<java.util.Map<String, Object>> getApartmentsForMessaging(String siteId) {
        log.info("Fetching apartments for messaging in site: {}", siteId);
        
        // Tüm daireleri getir (sadece mesajı olanları değil)
        List<com.sitedefteri.entity.Apartment> apartments = apartmentRepository.findBySiteId(siteId);
        
        return apartments.stream()
                .map(apartment -> {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("id", apartment.getId());
                    map.put("number", apartment.getUnitNumber());
                    map.put("block", apartment.getBlockName() != null ? apartment.getBlockName() : "");
                    map.put("floor", apartment.getFloor());
                    
                    // Sakin bilgisini ekle
                    if (apartment.getCurrentResidentId() != null) {
                        userRepository.findById(apartment.getCurrentResidentId()).ifPresent(resident -> {
                            map.put("residentId", resident.getId());
                            map.put("residentName", resident.getFullName());
                        });
                    }
                    
                    // Eğer sakin yoksa default değer
                    if (!map.containsKey("residentName")) {
                        map.put("residentName", "Boş Daire");
                    }
                    
                    return map;
                })
                .collect(Collectors.toList());
    }
    
    /**
     * Super Admin mesajlarını getir
     */
    public List<MessageResponse> getSuperAdminMessages(String siteId, String userId) {
        log.info("Fetching super admin messages for site: {} and user: {}", siteId, userId);
        // Super admin mesajları için chatType = 'system' olan mesajları getir
        List<Message> messages = messageRepository.findBySiteIdAndChatTypeOrderByCreatedAtAsc(siteId, "system");
        return messages.stream().map(this::toResponse).collect(Collectors.toList());
    }
    
    /**
     * Super Admin'e mesaj gönder
     */
    @Transactional
    public MessageResponse sendMessageToSuperAdmin(String siteId, String userId, String content) {
        log.info("Sending message to super admin from user: {}", userId);
        
        Message message = new Message();
        message.setSiteId(siteId);
        message.setSenderId(userId);
        message.setReceiverId("super_admin"); // Super admin ID
        message.setChatType("system");
        message.setBody(content);
        message.setIsRead(false);
        
        Message saved = messageRepository.save(message);
        log.info("Message sent to super admin with ID: {}", saved.getId());
        
        return toResponse(saved);
    }
}
