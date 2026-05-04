package com.sitedefteri.repository;

import com.sitedefteri.entity.NotificationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationHistoryRepository extends JpaRepository<NotificationHistory, Long> {
    
    List<NotificationHistory> findByUserIdOrderBySentAtDesc(String userId);
    
    List<NotificationHistory> findByTypeOrderBySentAtDesc(String type);
    
    long countByUserIdAndReadAtIsNull(String userId);
}
