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
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageService {
    
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final com.sitedefteri.repository.ApartmentRepository apartmentRepository;
    private final UserService userService;
    
    @PersistenceContext
    private EntityManager entityManager;
    
    @Transactional
    public MessageResponse createMessage(CreateMessageRequest request, String senderId) {
        log.info("Creating message from user: {}, chatType: {}", senderId, request.getChatType());
        
        // Kullanıcının bu siteye üye olup olmadığını kontrol et
        if (!isUserMemberOfSite(senderId, request.getSiteId())) {
            log.error("User {} is not a member of site {}, cannot send message", senderId, request.getSiteId());
            throw new IllegalArgumentException("Bu siteye mesaj gönderme yetkiniz yok. Lütfen site üyeliğinizi kontrol edin.");
        }
        
        Message message = new Message();
        message.setSiteId(request.getSiteId());
        message.setSenderId(senderId);
        
        // ApartmentId'yi belirle
        String apartmentId = request.getApartmentId();
        log.info("Request apartmentId: {}", apartmentId);
        
        // Eğer apartmentId gönderilmemişse ve chatType 'security' veya 'apartment' ise,
        // kullanıcının apartmentId'sini otomatik olarak al
        if (apartmentId == null && ("security".equals(request.getChatType()) || "apartment".equals(request.getChatType()))) {
            apartmentId = getUserApartmentId(senderId);
            log.info("Auto-detected apartmentId for user {}: {}", senderId, apartmentId);
        }
        
        // receiverId'yi ayarla
        // Eğer receiverId açıkça belirtilmişse (1-1 mesaj), onu kullan
        // Eğer receiverId null ise ve apartmentId varsa, daire bazlı mesaj (herkes görsün)
        if (request.getReceiverId() != null) {
            // 1-1 direct message - receiverId'yi kullan
            message.setReceiverId(request.getReceiverId());
            log.info("Direct message - receiverId set to: {}", request.getReceiverId());
            
            // Alıcının da site üyesi olup olmadığını kontrol et
            if (!isUserMemberOfSite(request.getReceiverId(), request.getSiteId())) {
                log.error("Receiver {} is not a member of site {}, cannot send message", 
                         request.getReceiverId(), request.getSiteId());
                throw new IllegalArgumentException("Mesaj göndermek istediğiniz kullanıcı bu sitenin üyesi değil.");
            }
        } else if ("apartment".equals(request.getChatType()) && apartmentId != null) {
            // Daire bazlı mesaj - receiverId NULL (hem malik hem kiracı görsün)
            message.setReceiverId(null);
            log.info("Apartment-wide message - receiverId set to NULL for apartment: {}", apartmentId);
        } else {
            // Diğer durumlar
            message.setReceiverId(null);
            log.info("Other message type - receiverId set to NULL");
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
        
        // Eğer daire bazlı mesajsa, hem malik hem kiracıya bildirim gönder
        // Not: Bildirim sistemi şu an private method kullanıyor, 
        // kullanıcılar mesajları zaten mesajlar sayfasında görecek
        if ("apartment".equals(request.getChatType()) && apartmentId != null) {
            log.info("Apartment message saved for apartment: {}, residents will see it in messages", apartmentId);
        }
        
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
        
        // Sadece site üyesi olan kullanıcıların mesajlarını filtrele
        return messages.stream()
                .filter(msg -> isUserMemberOfSite(msg.getSenderId(), siteId))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    public List<MessageResponse> getSiteMessages(String siteId, String userId) {
        log.info("Fetching all messages for site: {} and user: {}", siteId, userId);
        
        // Kullanıcının bu siteye üye olup olmadığını kontrol et
        if (!isUserMemberOfSite(userId, siteId)) {
            log.warn("User {} is not a member of site {}, returning empty message list", userId, siteId);
            return List.of();
        }
        
        // Kullanıcının apartmentId'sini al
        String userApartmentId = getUserApartmentId(userId);
        log.info("User {} apartment ID: {}", userId, userApartmentId);
        
        // Hem group, security, hem de apartment mesajlarını getir
        List<Message> groupMessages = messageRepository.findBySiteIdAndChatTypeOrderByCreatedAtAsc(siteId, "group");
        List<Message> securityMessages = messageRepository.findSecurityMessagesByUser(siteId);
        List<Message> apartmentMessages = messageRepository.findBySiteIdAndChatTypeOrderByCreatedAtAsc(siteId, "apartment");
        
        // Hepsini birleştir
        groupMessages.addAll(securityMessages);
        groupMessages.addAll(apartmentMessages);
        
        // Sadece site üyesi olan kullanıcıların mesajlarını filtrele
        List<Message> filteredMessages = groupMessages.stream()
                .filter(msg -> {
                    // Gönderen site üyesi mi?
                    boolean senderIsMember = isUserMemberOfSite(msg.getSenderId(), siteId);
                    if (!senderIsMember) {
                        log.debug("Filtering out message from non-member sender: {}", msg.getSenderId());
                        return false;
                    }
                    
                    // Apartment mesajları için: Kullanıcının dairesindeki mesajları göster
                    if ("apartment".equals(msg.getChatType())) {
                        // Eğer mesaj kullanıcının dairesine aitse göster
                        if (userApartmentId != null && userApartmentId.equals(msg.getApartmentId())) {
                            return true;
                        }
                        // Eğer kullanıcı gönderen veya alıcıysa göster
                        if (userId.equals(msg.getSenderId()) || userId.equals(msg.getReceiverId())) {
                            return true;
                        }
                        // Diğer daire mesajlarını gösterme
                        return false;
                    }
                    
                    return true;
                })
                .collect(Collectors.toList());
        
        // Tarihe göre sırala
        return filteredMessages.stream()
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
        
        // Receiver bilgisini al (eğer receiverId varsa)
        User receiver = null;
        if (message.getReceiverId() != null) {
            receiver = userRepository.findById(message.getReceiverId()).orElse(null);
        }
        
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
                .receiverName(receiver != null ? receiver.getFullName() : null)
                .receiverRole(receiver != null ? getUserRole(receiver) : null)
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
     * SADECE bu siteye üye olan kullanıcıların mesajlarını göster
     * Hem malik hem kiracı aynı mesajları görür
     */
    public List<MessageResponse> getApartmentMessages(String siteId, String apartmentId) {
        log.info("Fetching apartment messages for site: {}, apartment: {}", siteId, apartmentId);
        List<Message> messages = messageRepository.findApartmentMessages(siteId, apartmentId);
        
        // Sadece site üyesi olan kullanıcıların mesajlarını filtrele
        return messages.stream()
                .filter(msg -> isUserMemberOfSite(msg.getSenderId(), siteId))
                .map(this::toResponse)
                .collect(Collectors.toList());
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
     * SADECE bu siteye üye olan sakinlerin dairelerini göster
     */
    public List<java.util.Map<String, Object>> getApartmentsForMessaging(String siteId) {
        log.info("Fetching apartments for messaging in site: {}", siteId);
        
        // Tüm daireleri getir
        List<com.sitedefteri.entity.Apartment> apartments = apartmentRepository.findBySiteId(siteId);
        
        // Site üyesi olan tüm sakinleri al
        List<String> siteMemberIds = getSiteMemberIds(siteId);
        log.info("Found {} site members for site {}", siteMemberIds.size(), siteId);
        
        // UserService'den tüm kullanıcıları al (UserResponse olarak, apartmentId ve residentType ile)
        // getAllUsersBySite yerine direkt userRepository kullanıp toResponseWithApartment çağıralım
        List<com.sitedefteri.entity.User> allSiteUsers = userRepository.findBySiteId(siteId);
        
        // Kullanıcıları apartment_id'ye göre grupla
        java.util.Map<String, java.util.List<com.sitedefteri.dto.response.UserResponse>> usersByApartment = new java.util.HashMap<>();
        
        for (com.sitedefteri.entity.User user : allSiteUsers) {
            if (!siteMemberIds.contains(user.getId())) {
                continue;
            }
            
            // Kullanıcının hangi dairede olduğunu bul
            for (com.sitedefteri.entity.Apartment apt : apartments) {
                boolean isOwner = user.getId().equals(apt.getOwnerUserId());
                boolean isResident = user.getId().equals(apt.getCurrentResidentId());
                
                if (isOwner || isResident) {
                    com.sitedefteri.dto.response.UserResponse userResponse = new com.sitedefteri.dto.response.UserResponse();
                    userResponse.setUserId(user.getId());
                    userResponse.setFullName(user.getFullName());
                    userResponse.setResidentType(isOwner ? "owner" : "tenant");
                    
                    usersByApartment.computeIfAbsent(apt.getId(), k -> new java.util.ArrayList<>()).add(userResponse);
                    break;
                }
            }
        }
        
        return apartments.stream()
                .map(apartment -> {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("id", apartment.getId());
                    map.put("number", apartment.getUnitNumber());
                    map.put("block", apartment.getBlockName() != null ? apartment.getBlockName() : "");
                    map.put("floor", apartment.getFloor());
                    
                    StringBuilder residentNames = new StringBuilder();
                    
                    // Bu dairedeki kullanıcıları al
                    java.util.List<com.sitedefteri.dto.response.UserResponse> apartmentUsers = usersByApartment.get(apartment.getId());
                    
                    String ownerId = null;
                    String ownerName = null;
                    String tenantId = null;
                    String tenantName = null;
                    
                    if (apartmentUsers != null) {
                        for (com.sitedefteri.dto.response.UserResponse user : apartmentUsers) {
                            String residentType = user.getResidentType();
                            
                            if ("owner".equalsIgnoreCase(residentType) || "malik".equalsIgnoreCase(residentType)) {
                                if (ownerId == null) {
                                    ownerId = user.getUserId();
                                    ownerName = user.getFullName();
                                }
                            } else if ("tenant".equalsIgnoreCase(residentType) || "kiracı".equalsIgnoreCase(residentType) || "kiraci".equalsIgnoreCase(residentType)) {
                                if (tenantId == null) {
                                    tenantId = user.getUserId();
                                    tenantName = user.getFullName();
                                }
                            }
                        }
                    }
                    
                    // Kiracı varsa önce onu ekle
                    if (tenantId != null) {
                        map.put("residentId", tenantId);
                        map.put("tenantName", tenantName);
                        residentNames.append(tenantName).append(" (Kiracı)");
                    }
                    
                    // Malik varsa ekle
                    if (ownerId != null) {
                        map.put("ownerId", ownerId);
                        map.put("ownerName", ownerName);
                        
                        if (residentNames.length() > 0) {
                            residentNames.append(" • ");
                        }
                        residentNames.append(ownerName).append(" (Malik)");
                    }
                    
                    // Birleştirilmiş isim
                    if (residentNames.length() > 0) {
                        map.put("residentName", residentNames.toString());
                        map.put("isSiteMember", true);
                    } else {
                        map.put("residentName", "Boş Daire");
                        map.put("isSiteMember", false);
                    }
                    
                    return map;
                })
                // TÜM daireleri döndür (boş daireler dahil)
                .collect(Collectors.toList());
    }
    
    /**
     * Site üyesi olan tüm kullanıcı ID'lerini getir (user_site_memberships'ten)
     */
    private List<String> getSiteMemberIds(String siteId) {
        try {
            String query = "SELECT user_id FROM user_site_memberships " +
                          "WHERE site_id = :siteId " +
                          "AND is_deleted = FALSE AND status = 'aktif'";
            
            @SuppressWarnings("unchecked")
            List<String> result = entityManager.createNativeQuery(query)
                    .setParameter("siteId", siteId)
                    .getResultList();
            
            return result;
        } catch (Exception e) {
            log.error("Error getting site member IDs for site {}: {}", siteId, e.getMessage());
            return new ArrayList<>();
        }
    }
    
    /**
     * Kullanıcının belirli bir siteye üye olup olmadığını kontrol et
     */
    private boolean isUserMemberOfSite(String userId, String siteId) {
        try {
            String query = "SELECT COUNT(*) as count FROM user_site_memberships " +
                          "WHERE user_id = :userId AND site_id = :siteId " +
                          "AND is_deleted = FALSE AND status = 'aktif'";
            
            Object result = entityManager.createNativeQuery(query)
                    .setParameter("userId", userId)
                    .setParameter("siteId", siteId)
                    .getSingleResult();
            
            Long count = ((Number) result).longValue();
            return count > 0;
        } catch (Exception e) {
            log.error("Error checking site membership for user {}: {}", userId, e.getMessage());
            return false;
        }
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
