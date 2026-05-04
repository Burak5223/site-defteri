package com.sitedefteri.controller;

import com.sitedefteri.dto.response.SessionResponse;
import com.sitedefteri.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {
    
    private final SessionService sessionService;
    
    @Autowired
    private com.sitedefteri.security.SecurityUtils securityUtils;
    
    @GetMapping
    public ResponseEntity<List<SessionResponse>> getUserSessions() {
        String userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(sessionService.getUserSessions(userId));
    }
    
    @DeleteMapping("/{sessionId}")
    public ResponseEntity<Map<String, String>> terminateSession(@PathVariable Long sessionId) {
        String userId = securityUtils.getCurrentUserId();
        sessionService.terminateSession(sessionId, userId);
        return ResponseEntity.ok(Map.of("message", "Oturum sonlandırıldı"));
    }
    
    @DeleteMapping("/all")
    public ResponseEntity<Map<String, String>> terminateAllSessions() {
        String userId = securityUtils.getCurrentUserId();
        sessionService.terminateAllSessions(userId);
        return ResponseEntity.ok(Map.of("message", "Tüm oturumlar sonlandırıldı"));
    }
}
