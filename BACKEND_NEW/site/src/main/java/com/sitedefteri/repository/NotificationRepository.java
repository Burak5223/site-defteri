package com.sitedefteri.repository;

import com.sitedefteri.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);
    List<Notification> findByUserIdAndIsReadOrderByCreatedAtDesc(String userId, Boolean isRead);
    long countByUserIdAndIsRead(String userId, Boolean isRead);
}
