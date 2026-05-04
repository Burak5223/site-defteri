package com.sitedefteri.repository;

import com.sitedefteri.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    
    List<Message> findBySiteIdOrderByCreatedAtAsc(String siteId);
    
    List<Message> findByApartmentIdOrderByCreatedAtAsc(String apartmentId);
    
    @Query("SELECT m FROM Message m WHERE m.siteId = :siteId AND m.chatType = :chatType ORDER BY m.createdAt ASC")
    List<Message> findBySiteIdAndChatType(@Param("siteId") String siteId, @Param("chatType") String chatType);
    
    @Query("SELECT m FROM Message m WHERE m.siteId = :siteId AND m.chatType = :chatType ORDER BY m.createdAt ASC")
    List<Message> findBySiteIdAndChatTypeOrderByCreatedAtAsc(@Param("siteId") String siteId, @Param("chatType") String chatType);
    
    // 1-to-1 conversation between two users
    @Query("SELECT m FROM Message m WHERE " +
           "((m.senderId = :userId1 AND m.receiverId = :userId2) OR " +
           "(m.senderId = :userId2 AND m.receiverId = :userId1)) " +
           "ORDER BY m.createdAt ASC")
    List<Message> findConversation(@Param("userId1") String userId1, @Param("userId2") String userId2);
    
    // Count unread messages for a user from a specific sender
    @Query("SELECT COUNT(m) FROM Message m WHERE m.receiverId = :receiverId AND m.senderId = :senderId AND m.isRead = false")
    Integer countUnreadMessages(@Param("receiverId") String receiverId, @Param("senderId") String senderId);
    
    // Mark messages as read
    @Modifying
    @Query("UPDATE Message m SET m.isRead = true WHERE m.receiverId = :receiverId AND m.senderId = :senderId AND m.isRead = false")
    void markMessagesAsRead(@Param("receiverId") String receiverId, @Param("senderId") String senderId);
    
    // Get last message between two users
    @Query("SELECT m FROM Message m WHERE " +
           "((m.senderId = :userId1 AND m.receiverId = :userId2) OR " +
           "(m.senderId = :userId2 AND m.receiverId = :userId1)) " +
           "ORDER BY m.createdAt DESC")
    List<Message> findLastMessage(@Param("userId1") String userId1, @Param("userId2") String userId2);
    
    // Super Admin messaging - get messages between Super Admin and manager
    @Query("SELECT m FROM Message m WHERE m.chatType = :chatType AND " +
           "((m.senderId = :superAdminId AND m.receiverId = :managerId) OR " +
           "(m.senderId = :managerId AND m.receiverId = :superAdminId)) " +
           "ORDER BY m.createdAt ASC")
    List<Message> findByChatTypeAndParticipants(@Param("chatType") String chatType, 
                                               @Param("superAdminId") String superAdminId, 
                                               @Param("managerId") String managerId);
    
    // Security messages for a user
    @Query("SELECT m FROM Message m WHERE m.siteId = :siteId AND m.chatType = 'security' " +
           "ORDER BY m.createdAt ASC")
    List<Message> findSecurityMessagesByUser(@Param("siteId") String siteId);
    
    // Security messages between two users
    @Query("SELECT m FROM Message m WHERE m.siteId = :siteId AND m.chatType = 'security' AND " +
           "((m.senderId = :userId1 AND m.receiverId = :userId2) OR " +
           "(m.senderId = :userId2 AND m.receiverId = :userId1)) " +
           "ORDER BY m.createdAt ASC")
    List<Message> findSecurityMessagesBetweenUsers(@Param("siteId") String siteId, 
                                                   @Param("userId1") String userId1, 
                                                   @Param("userId2") String userId2);
    
    // Count unread messages by receiver
    @Query("SELECT COUNT(m) FROM Message m WHERE m.receiverId = :receiverId AND m.isRead = false")
    long countUnreadByReceiverId(@Param("receiverId") String receiverId);
    
    // Apartment messages
    @Query("SELECT m FROM Message m WHERE m.siteId = :siteId AND m.apartmentId = :apartmentId " +
           "ORDER BY m.createdAt ASC")
    List<Message> findApartmentMessages(@Param("siteId") String siteId, @Param("apartmentId") String apartmentId);
    
    // Get apartments with messages
    @Query("SELECT DISTINCT m.apartmentId FROM Message m WHERE m.siteId = :siteId AND m.apartmentId IS NOT NULL")
    List<String> findApartmentsWithMessages(@Param("siteId") String siteId);
}
