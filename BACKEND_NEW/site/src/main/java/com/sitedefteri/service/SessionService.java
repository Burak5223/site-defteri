package com.sitedefteri.service;

import com.sitedefteri.dto.response.SessionResponse;
import com.sitedefteri.entity.User;
import com.sitedefteri.entity.UserSession;
import com.sitedefteri.exception.ResourceNotFoundException;
import com.sitedefteri.repository.UserRepository;
import com.sitedefteri.repository.UserSessionRepository;
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
public class SessionService {
    
    private final UserSessionRepository sessionRepository;
    private final UserRepository userRepository;
    
    @Transactional
    public UserSession createSession(String userId, String tokenHash, String deviceInfo, String ipAddress) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        UserSession session = new UserSession();
        session.setUser(user);
        session.setTokenHash(tokenHash);
        session.setDeviceInfo(deviceInfo);
        session.setIpAddress(ipAddress);
        session.setExpiresAt(LocalDateTime.now().plusDays(7)); // 7 days expiry
        session.setLastActivity(LocalDateTime.now());
        session.setIsActive(true);
        
        return sessionRepository.save(session);
    }
    
    @Transactional(readOnly = true)
    public List<SessionResponse> getUserSessions(String userId) {
        List<UserSession> sessions = sessionRepository.findByUserIdAndIsActiveTrue(userId);
        
        return sessions.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public void terminateSession(Long sessionId, String userId) {
        // Convert Long sessionId to String
        UserSession session = sessionRepository.findById(String.valueOf(sessionId))
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        
        if (!session.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Session not found");
        }
        
        session.setIsActive(false);
        sessionRepository.save(session);
        
        log.info("Session {} terminated for user {}", sessionId, userId);
    }
    
    @Transactional
    public void terminateAllSessions(String userId) {
        sessionRepository.deactivateAllUserSessions(userId);
        log.info("All sessions terminated for user {}", userId);
    }
    
    @Transactional
    public void updateSessionActivity(String tokenHash) {
        sessionRepository.findByTokenHash(tokenHash)
                .ifPresent(session -> {
                    session.setLastActivity(LocalDateTime.now());
                    sessionRepository.save(session);
                });
    }
    
    @Transactional
    public void cleanupExpiredSessions() {
        sessionRepository.deactivateExpiredSessions(LocalDateTime.now());
        log.info("Expired sessions cleaned up");
    }
    
    private SessionResponse mapToResponse(UserSession session) {
        SessionResponse response = new SessionResponse();
        response.setId(session.getId());
        response.setDeviceInfo(session.getDeviceInfo());
        response.setIpAddress(session.getIpAddress());
        response.setLastActivity(session.getLastActivity());
        response.setExpiresAt(session.getExpiresAt());
        response.setIsActive(session.getIsActive());
        response.setCreatedAt(session.getCreatedAt());
        return response;
    }
}
