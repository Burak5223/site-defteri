package com.sitedefteri.controller;

import com.sitedefteri.dto.request.AssignApartmentRequest;
import com.sitedefteri.dto.request.InviteUserRequest;
import com.sitedefteri.dto.request.UpdateUserRequest;
import com.sitedefteri.dto.response.UserResponse;
import com.sitedefteri.security.JwtTokenProvider;
import com.sitedefteri.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserController {
    
    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;
    
    /**
     * Get all users for a site
     * GET /api/sites/{siteId}/users
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/sites/{siteId}/users")
    public ResponseEntity<List<UserResponse>> getSiteUsers(@PathVariable String siteId) {
        return ResponseEntity.ok(userService.getUsersBySite(siteId));
    }
    
    /**
     * Get user by ID
     * GET /api/users/{userId}
     */
    @GetMapping("/users/{userId}")
    public ResponseEntity<UserResponse> getUser(@PathVariable String userId) {
        return ResponseEntity.ok(userService.getUserById(userId));
    }
    
    /**
     * Invite new user
     * POST /api/users/invite
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/users/invite")
    public ResponseEntity<UserResponse> inviteUser(
            @Valid @RequestBody InviteUserRequest request,
            HttpServletRequest httpRequest) {
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String invitedBy = jwtTokenProvider.getUserIdFromToken(token);
        return ResponseEntity.ok(userService.inviteUser(request, invitedBy));
    }
    
    /**
     * Update user
     * PUT /api/users/{userId}
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/users/{userId}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable String userId,
            @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.updateUser(userId, request));
    }
    
    /**
     * Assign apartment to user
     * POST /api/users/{userId}/assign-apartment
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/users/{userId}/assign-apartment")
    public ResponseEntity<UserResponse> assignApartment(
            @PathVariable String userId,
            @Valid @RequestBody AssignApartmentRequest request) {
        return ResponseEntity.ok(userService.assignApartment(userId, request));
    }
    
    /**
     * Remove resident from apartment
     * DELETE /api/users/{userId}/apartments/{apartmentId}
     */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/users/{userId}/apartments/{apartmentId}")
    public ResponseEntity<java.util.Map<String, String>> removeResidentFromApartment(
            @PathVariable String userId,
            @PathVariable String apartmentId) {
        userService.removeResidentFromApartment(userId, apartmentId);
        return ResponseEntity.ok(java.util.Map.of(
            "status", "success",
            "message", "Kullanıcı daireden başarıyla çıkarıldı"
        ));
    }
    
    /**
     * Change user's apartment
     * PUT /api/users/{userId}/change-apartment
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/users/{userId}/change-apartment")
    public ResponseEntity<UserResponse> changeApartment(
            @PathVariable String userId,
            @Valid @RequestBody AssignApartmentRequest request) {
        return ResponseEntity.ok(userService.changeApartment(userId, request.getApartmentId(), request.getAssignmentType()));
    }
    
    /**
     * Delete user (soft delete)
     * DELETE /api/users/{userId}
     */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable String userId) {
        userService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Get current user profile
     * GET /api/users/me
     */
    @GetMapping("/users/me")
    public ResponseEntity<UserResponse> getCurrentUser(HttpServletRequest httpRequest) {
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String userId = jwtTokenProvider.getUserIdFromToken(token);
        return ResponseEntity.ok(userService.getUserById(userId));
    }
    
    /**
     * Get current user profile (alias)
     * GET /api/users/profile
     */
    @GetMapping("/users/profile")
    public ResponseEntity<UserResponse> getUserProfile(HttpServletRequest httpRequest) {
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String userId = jwtTokenProvider.getUserIdFromToken(token);
        return ResponseEntity.ok(userService.getUserById(userId));
    }
    
    /**
     * Update current user profile
     * PUT /api/users/me
     */
    @PutMapping("/users/me")
    public ResponseEntity<UserResponse> updateCurrentUser(
            @Valid @RequestBody UpdateUserRequest request,
            HttpServletRequest httpRequest) {
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String userId = jwtTokenProvider.getUserIdFromToken(token);
        return ResponseEntity.ok(userService.updateUser(userId, request));
    }
    
    /**
     * Save FCM token for push notifications
     * POST /api/users/fcm-token
     */
    @PostMapping("/users/fcm-token")
    public ResponseEntity<java.util.Map<String, String>> saveFcmToken(
            @RequestBody java.util.Map<String, String> request,
            HttpServletRequest httpRequest) {
        
        String fcmToken = request.get("token");
        String deviceType = request.get("deviceType");
        
        // JWT token varsa kullanıcı ID'sini al, yoksa anonymous olarak kaydet
        String userId = "anonymous";
        try {
            String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
            if (token != null && !token.isEmpty()) {
                userId = jwtTokenProvider.getUserIdFromToken(token);
            }
        } catch (Exception e) {
            // JWT token yoksa veya geçersizse, anonymous olarak devam et
        }
        
        userService.saveFcmToken(userId, fcmToken);
        
        return ResponseEntity.ok(java.util.Map.of(
            "status", "success",
            "message", "FCM token saved successfully",
            "userId", userId
        ));
    }


    /**
     * Get all users (for admin/super admin/security/cleaning/resident)
     * GET /api/users
     * Returns only users from the same site as the current user
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'SECURITY', 'CLEANING', 'RESIDENT')")
    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers(HttpServletRequest httpRequest) {
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String userId = jwtTokenProvider.getUserIdFromToken(token);
        return ResponseEntity.ok(userService.getAllUsersBySite(userId));
    }
    
    /**
     * Update user's preferred language
     * PUT /api/users/me/language
     * Body: { "language": "tr" | "en" | "ru" | "ar" }
     */
    @PutMapping("/users/me/language")
    public ResponseEntity<java.util.Map<String, String>> updateLanguage(
            @RequestBody java.util.Map<String, String> request,
            HttpServletRequest httpRequest) {
        
        String language = request.get("language");
        
        // Validate language
        if (language == null || !java.util.List.of("tr", "en", "ru", "ar").contains(language)) {
            return ResponseEntity.badRequest().body(java.util.Map.of(
                "status", "error",
                "message", "Invalid language. Supported: tr, en, ru, ar"
            ));
        }
        
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String userId = jwtTokenProvider.getUserIdFromToken(token);
        
        userService.updateUserLanguage(userId, language);
        
        return ResponseEntity.ok(java.util.Map.of(
            "status", "success",
            "message", "Language updated successfully",
            "language", language
        ));
    }
    
    /**
     * Get user's preferred language
     * GET /api/users/me/language
     */
    @GetMapping("/users/me/language")
    public ResponseEntity<java.util.Map<String, String>> getLanguage(HttpServletRequest httpRequest) {
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String userId = jwtTokenProvider.getUserIdFromToken(token);
        
        String language = userService.getUserLanguage(userId);
        
        return ResponseEntity.ok(java.util.Map.of(
            "language", language != null ? language : "tr"
        ));
    }
    
    /**
     * Get user's QR token for package collection
     * GET /api/users/me/qr-token
     */
    @GetMapping("/users/me/qr-token")
    public ResponseEntity<java.util.Map<String, String>> getMyQRToken(HttpServletRequest httpRequest) {
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String userId = jwtTokenProvider.getUserIdFromToken(token);
        
        String qrToken = userService.getUserQRToken(userId);
        
        return ResponseEntity.ok(java.util.Map.of(
            "qrToken", qrToken,
            "type", "user"
        ));
    }
    
    /**
     * Change password
     * PUT /api/users/me/password
     */
    @PutMapping("/users/me/password")
    public ResponseEntity<java.util.Map<String, String>> changePassword(
            @Valid @RequestBody com.sitedefteri.dto.request.ChangePasswordRequest request,
            HttpServletRequest httpRequest) {
        
        // Validate password confirmation
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            return ResponseEntity.badRequest().body(java.util.Map.of(
                "status", "error",
                "message", "Yeni şifre ve şifre tekrarı eşleşmiyor"
            ));
        }
        
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String userId = jwtTokenProvider.getUserIdFromToken(token);
        
        try {
            userService.changePassword(userId, request.getCurrentPassword(), request.getNewPassword());
            
            return ResponseEntity.ok(java.util.Map.of(
                "status", "success",
                "message", "Şifre başarıyla değiştirildi"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of(
                "status", "error",
                "message", e.getMessage()
            ));
        }
    }
}
