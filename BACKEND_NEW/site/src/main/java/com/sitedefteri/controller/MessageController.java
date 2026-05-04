package com.sitedefteri.controller;

import com.sitedefteri.dto.request.CreateMessageRequest;
import com.sitedefteri.dto.response.MessageResponse;
import com.sitedefteri.security.JwtTokenProvider;
import com.sitedefteri.service.MessageService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MessageController {
    
    private final MessageService messageService;
    private final JwtTokenProvider jwtTokenProvider;
    
    @PostMapping("/messages")
    public ResponseEntity<MessageResponse> createMessage(
            @Valid @RequestBody CreateMessageRequest request,
            HttpServletRequest httpRequest) {
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String userId = jwtTokenProvider.getUserIdFromToken(token);
        return ResponseEntity.ok(messageService.createMessage(request, userId));
    }
    
    @GetMapping("/sites/{siteId}/messages")
    public ResponseEntity<List<MessageResponse>> getSiteMessages(
            @PathVariable String siteId,
            HttpServletRequest httpRequest) {
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String userId = jwtTokenProvider.getUserIdFromToken(token);
        // Site mesajlarını getir (group + security)
        return ResponseEntity.ok(messageService.getSiteMessages(siteId, userId));
    }
    
    @GetMapping("/sites/{siteId}/messages/group")
    public ResponseEntity<List<MessageResponse>> getGroupMessages(@PathVariable String siteId) {
        return ResponseEntity.ok(messageService.getGroupMessages(siteId));
    }
    
    @GetMapping("/sites/{siteId}/messages/security")
    public ResponseEntity<List<MessageResponse>> getMySecurityMessages(
            @PathVariable String siteId,
            HttpServletRequest httpRequest) {
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String userId = jwtTokenProvider.getUserIdFromToken(token);
        return ResponseEntity.ok(messageService.getMySecurityMessages(siteId, userId));
    }
    
    @GetMapping("/sites/{siteId}/messages/security/{otherUserId}")
    public ResponseEntity<List<MessageResponse>> getSecurityMessages(
            @PathVariable String siteId,
            @PathVariable String otherUserId,
            HttpServletRequest httpRequest) {
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String userId = jwtTokenProvider.getUserIdFromToken(token);
        return ResponseEntity.ok(messageService.getSecurityMessages(siteId, userId, otherUserId));
    }
    
    @PutMapping("/messages/{messageId}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable String messageId,
            HttpServletRequest httpRequest) {
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String userId = jwtTokenProvider.getUserIdFromToken(token);
        messageService.markAsRead(messageId, userId);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/messages/unread-count")
    public ResponseEntity<Long> getUnreadCount(HttpServletRequest httpRequest) {
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String userId = jwtTokenProvider.getUserIdFromToken(token);
        return ResponseEntity.ok(messageService.getUnreadCount(userId));
    }
    
    @GetMapping("/messages")
    public ResponseEntity<List<MessageResponse>> getAllMessages(HttpServletRequest httpRequest) {
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String userId = jwtTokenProvider.getUserIdFromToken(token);
        return ResponseEntity.ok(messageService.getMyMessages(userId));
    }
    
    @GetMapping("/messages/my")
    public ResponseEntity<List<MessageResponse>> getMyMessages(HttpServletRequest httpRequest) {
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String userId = jwtTokenProvider.getUserIdFromToken(token);
        return ResponseEntity.ok(messageService.getMyMessages(userId));
    }
    
    @PutMapping("/messages/{messageId}")
    public ResponseEntity<MessageResponse> updateMessage(
            @PathVariable String messageId,
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String userId = jwtTokenProvider.getUserIdFromToken(token);
        String body = request.get("body");
        return ResponseEntity.ok(messageService.updateMessage(messageId, body));
    }
    
    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<Void> deleteMessage(
            @PathVariable String messageId,
            HttpServletRequest httpRequest) {
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String userId = jwtTokenProvider.getUserIdFromToken(token);
        messageService.deleteMessage(messageId);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/sites/{siteId}/apartments/{apartmentId}/messages")
    public ResponseEntity<List<MessageResponse>> getApartmentMessages(
            @PathVariable String siteId,
            @PathVariable String apartmentId) {
        // Not implemented - mobile app uses client-side filtering
        return ResponseEntity.ok(List.of());
    }
    
    @GetMapping("/sites/{siteId}/apartments-with-messages")
    public ResponseEntity<List<String>> getApartmentsWithMessages(@PathVariable String siteId) {
        // Not implemented - mobile app uses client-side filtering
        return ResponseEntity.ok(List.of());
    }
    
    @GetMapping("/sites/{siteId}/messages/apartments")
    public ResponseEntity<List<Map<String, Object>>> getApartmentsForMessaging(@PathVariable String siteId) {
        return ResponseEntity.ok(messageService.getApartmentsForMessaging(siteId));
    }
    
    // Super Admin Messaging Endpoints
    @GetMapping("/sites/{siteId}/messages/super-admin")
    public ResponseEntity<List<MessageResponse>> getSuperAdminMessages(
            @PathVariable String siteId,
            HttpServletRequest httpRequest) {
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String userId = jwtTokenProvider.getUserIdFromToken(token);
        return ResponseEntity.ok(messageService.getSuperAdminMessages(siteId, userId));
    }
    
    @PostMapping("/sites/{siteId}/messages/super-admin")
    public ResponseEntity<MessageResponse> sendMessageToSuperAdmin(
            @PathVariable String siteId,
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String userId = jwtTokenProvider.getUserIdFromToken(token);
        String content = request.get("content");
        return ResponseEntity.ok(messageService.sendMessageToSuperAdmin(siteId, userId, content));
    }
}
