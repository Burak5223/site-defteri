package com.sitedefteri.repository;

import com.sitedefteri.entity.UserFcmToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserFcmTokenRepository extends JpaRepository<UserFcmToken, Long> {
    
    Optional<UserFcmToken> findByUserId(String userId);
    
    List<UserFcmToken> findAllByUserId(String userId);
    
    void deleteByUserId(String userId);
}
