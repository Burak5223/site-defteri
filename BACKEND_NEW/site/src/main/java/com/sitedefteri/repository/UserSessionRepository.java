package com.sitedefteri.repository;

import com.sitedefteri.entity.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, String> {
    
    Optional<UserSession> findByTokenHash(String tokenHash);
    
    @Query("SELECT s FROM UserSession s WHERE s.user.id = :userId AND s.isActive = true")
    List<UserSession> findByUserIdAndIsActiveTrue(String userId);
    
    @Modifying
    @Query("UPDATE UserSession s SET s.isActive = false WHERE s.user.id = :userId")
    void deactivateAllUserSessions(String userId);
    
    @Modifying
    @Query("UPDATE UserSession s SET s.isActive = false WHERE s.expiresAt < :now")
    void deactivateExpiredSessions(LocalDateTime now);
    
    @Query("SELECT COUNT(s) FROM UserSession s WHERE s.user.id = :userId AND s.isActive = true")
    long countActiveSessionsByUserId(String userId);
}
