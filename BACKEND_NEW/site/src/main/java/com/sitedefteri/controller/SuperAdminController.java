package com.sitedefteri.controller;

import com.sitedefteri.security.JwtTokenProvider;
import com.sitedefteri.service.UserService;
import com.sitedefteri.service.SiteService;
import com.sitedefteri.service.AnnouncementService;
import com.sitedefteri.service.SuperAdminService;
import com.sitedefteri.dto.response.UserResponse;
import com.sitedefteri.dto.request.InviteUserRequest;
import com.sitedefteri.dto.request.CreateAnnouncementRequest;
import com.sitedefteri.dto.response.AnnouncementResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/super-admin")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class SuperAdminController {
    
    private final UserService userService;
    private final SiteService siteService;
    private final AnnouncementService announcementService;
    private final SuperAdminService superAdminService;
    private final JwtTokenProvider jwtTokenProvider;
    
    /**
     * Get dashboard statistics
     * GET /api/dashboard/super-admin
     */
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        log.info("Getting Super Admin dashboard statistics");
        Map<String, Object> stats = superAdminService.getDashboardStats();
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Get all sites with statistics
     */
    @GetMapping("/sites")
    public ResponseEntity<List<Map<String, Object>>> getAllSites() {
        log.info("Getting all sites with statistics");
        List<Map<String, Object>> sites = superAdminService.getAllSitesWithStats();
        return ResponseEntity.ok(sites);
    }
    
    /**
     * Get apartments for a specific site
     * GET /api/super-admin/sites/{siteId}/apartments
     */
    @GetMapping("/sites/{siteId}/apartments")
    public ResponseEntity<List<Map<String, Object>>> getApartmentsBySite(@PathVariable String siteId) {
        log.info("Getting apartments for site: {}", siteId);
        List<Map<String, Object>> apartments = superAdminService.getApartmentsBySite(siteId);
        return ResponseEntity.ok(apartments);
    }
    
    /**
     * Get all managers
     * GET /api/super-admin/managers
     */
    @GetMapping("/managers")
    public ResponseEntity<List<Map<String, Object>>> getAllManagers(
            @RequestParam(required = false) String siteId) {
        log.info("Getting all managers, siteId: {}", siteId);
        List<Map<String, Object>> managers = superAdminService.getAllManagers();
        
        // Filter by siteId if provided
        if (siteId != null && !siteId.isEmpty()) {
            managers = managers.stream()
                    .filter(manager -> siteId.equals(manager.get("siteId")))
                    .toList();
        }
        
        return ResponseEntity.ok(managers);
    }
    
    // System Messages Endpoints
    @GetMapping("/system-messages")
    public ResponseEntity<List<Map<String, Object>>> getAllSystemMessages() {
        log.info("Getting all system messages");
        return ResponseEntity.ok(superAdminService.getAllSystemMessages());
    }
    
    @GetMapping("/system-messages/{siteId}")
    public ResponseEntity<List<Map<String, Object>>> getSystemMessagesBySite(@PathVariable String siteId) {
        log.info("Getting system messages for site: {}", siteId);
        return ResponseEntity.ok(superAdminService.getSystemMessagesBySite(siteId));
    }
    
    @PostMapping("/system-messages/{siteId}/reply")
    public ResponseEntity<Map<String, Object>> replyToSystemMessage(
            @PathVariable String siteId,
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String userId = jwtTokenProvider.getUserIdFromToken(token);
        String content = request.get("content");
        String recipientId = request.get("recipientId");
        
        log.info("Super admin replying to system message in site: {}", siteId);
        return ResponseEntity.ok(superAdminService.replyToSystemMessage(siteId, userId, recipientId, content));
    }
    
    /**
     * Create new manager
     * POST /api/super-admin/managers
     */
    @PostMapping("/managers")
    public ResponseEntity<UserResponse> createManager(
            @Valid @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        log.info("Creating new manager: {}", request.get("email"));
        
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String adminId = jwtTokenProvider.getUserIdFromToken(token);
        
        // Create invite request
        InviteUserRequest inviteRequest = new InviteUserRequest();
        inviteRequest.setEmail(request.get("email"));
        inviteRequest.setFullName(request.get("fullName"));
        inviteRequest.setPhone(request.get("phone"));
        inviteRequest.setSiteId(request.get("siteId"));
        inviteRequest.setRole("ADMIN");
        inviteRequest.setPassword(request.get("password")); // Manuel şifre
        
        UserResponse user = userService.inviteUser(inviteRequest, adminId);
        
        // Set role in response for mobile compatibility
        user.setRole("ADMIN");
        user.setUserId(user.getId());
        user.setSiteId(request.get("siteId"));
        
        return ResponseEntity.ok(user);
    }
    
    /**
     * Get all reports
     * GET /api/super-admin/reports
     */
    @GetMapping("/reports")
    public ResponseEntity<List<Map<String, Object>>> getAllReports() {
        log.info("Getting all reports");
        
        // Mock response for now
        return ResponseEntity.ok(List.of());
    }
    
    /**
     * Send bulk announcement
     * POST /api/super-admin/bulk-announcements
     */
    @PostMapping("/bulk-announcements")
    public ResponseEntity<Map<String, Object>> sendBulkAnnouncement(
            @Valid @RequestBody Map<String, Object> request,
            HttpServletRequest httpRequest) {
        log.info("Sending bulk announcement: {}", request.get("title"));
        
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String userId = jwtTokenProvider.getUserIdFromToken(token);
        
        // Get all sites
        var sites = siteService.getAllSites();
        
        // Create announcement for each site
        int successCount = 0;
        for (var site : sites) {
            try {
                CreateAnnouncementRequest announcementRequest = new CreateAnnouncementRequest();
                announcementRequest.setTitle((String) request.get("title"));
                announcementRequest.setContent((String) request.get("content"));
                announcementRequest.setPriority((String) request.getOrDefault("priority", "normal"));
                
                announcementService.createAnnouncement(announcementRequest, site.getId(), userId);
                successCount++;
            } catch (Exception e) {
                log.error("Failed to create announcement for site: {}", site.getId(), e);
            }
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Toplu duyuru gönderildi");
        response.put("totalSites", sites.size());
        response.put("successCount", successCount);
        response.put("failedCount", sites.size() - successCount);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get bulk announcements history
     * GET /api/super-admin/bulk-announcements
     */
    @GetMapping("/bulk-announcements")
    public ResponseEntity<List<Map<String, Object>>> getBulkAnnouncements() {
        log.info("Getting bulk announcements history");
        
        // Mock response for now
        return ResponseEntity.ok(List.of());
    }
    
    /**
     * Get all residents across all sites
     * GET /api/super-admin/residents
     */
    @GetMapping("/residents")
    public ResponseEntity<List<Map<String, Object>>> getAllResidents() {
        log.info("Getting all residents across all sites");
        List<Map<String, Object>> residents = superAdminService.getAllResidents();
        return ResponseEntity.ok(residents);
    }
    
    /**
     * Get finance data for Super Admin
     * GET /api/super-admin/finance
     */
    @GetMapping("/finance")
    public ResponseEntity<Map<String, Object>> getFinanceData(
            @RequestParam(defaultValue = "month") String period) {
        log.info("Getting finance data for period: {}", period);
        Map<String, Object> financeData = superAdminService.getFinanceData(period);
        return ResponseEntity.ok(financeData);
    }
    
    /**
     * Get performance data for Super Admin
     * GET /api/super-admin/performance
     */
    @GetMapping("/performance")
    public ResponseEntity<Map<String, Object>> getPerformanceData() {
        log.info("Getting performance data");
        Map<String, Object> performanceData = superAdminService.getPerformanceData();
        return ResponseEntity.ok(performanceData);
    }
    
    /**
     * Get messages with a specific manager
     * GET /api/super-admin/messages/{managerId}
     */
    @GetMapping("/messages/{managerId}")
    public ResponseEntity<List<Map<String, Object>>> getMessagesWithManager(
            @PathVariable String managerId,
            HttpServletRequest httpRequest) {
        log.info("Getting messages with manager: {}", managerId);
        
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String superAdminId = jwtTokenProvider.getUserIdFromToken(token);
        
        List<Map<String, Object>> messages = superAdminService.getMessagesWithManager(superAdminId, managerId);
        return ResponseEntity.ok(messages);
    }
    
    /**
     * Send message to manager
     * POST /api/super-admin/messages
     */
    @PostMapping("/messages")
    public ResponseEntity<Map<String, Object>> sendMessageToManager(
            @Valid @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        log.info("Sending message to manager: {}", request.get("recipientId"));
        
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String superAdminId = jwtTokenProvider.getUserIdFromToken(token);
        
        Map<String, Object> message = superAdminService.sendMessageToManager(
            superAdminId,
            request.get("recipientId"),
            request.get("content")
        );
        
        return ResponseEntity.ok(message);
    }
    
    /**
     * Impersonate a site admin
     * POST /api/super-admin/impersonate
     */
    @PostMapping("/impersonate")
    public ResponseEntity<Map<String, Object>> impersonateSiteAdmin(
            @Valid @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        String siteId = request.get("siteId");
        log.info("Super Admin impersonating site admin for siteId: {}", siteId);
        
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String superAdminId = jwtTokenProvider.getUserIdFromToken(token);
        
        try {
            // Get the first admin of the site
            List<Map<String, Object>> managers = superAdminService.getAllManagers();
            Map<String, Object> siteAdmin = managers.stream()
                    .filter(m -> siteId.equals(m.get("siteId")))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Bu site için yönetici bulunamadı"));
            
            String adminUserId = (String) siteAdmin.get("userId");
            
            // Generate new token for the admin user
            String impersonateToken = jwtTokenProvider.generateToken(
                adminUserId,
                (String) siteAdmin.get("email"),
                "ROLE_ADMIN",
                siteId
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("accessToken", impersonateToken);
            response.put("tokenType", "Bearer");
            response.put("userId", adminUserId);
            response.put("siteId", siteId);
            response.put("roles", List.of("ROLE_ADMIN"));
            response.put("impersonatedBy", superAdminId);
            response.put("originalRole", "ROLE_SUPER_ADMIN");
            
            // User info
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", adminUserId);
            userInfo.put("fullName", siteAdmin.get("fullName"));
            userInfo.put("email", siteAdmin.get("email"));
            userInfo.put("phone", siteAdmin.get("phone"));
            userInfo.put("siteId", siteId);
            userInfo.put("siteName", siteAdmin.get("siteName"));
            userInfo.put("status", "aktif");
            userInfo.put("roles", List.of("ROLE_ADMIN")); // Add roles to user object
            
            response.put("user", userInfo);
            
            log.info("Super Admin {} successfully impersonated admin {} for site {}", 
                    superAdminId, adminUserId, siteId);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Failed to impersonate site admin", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
}
