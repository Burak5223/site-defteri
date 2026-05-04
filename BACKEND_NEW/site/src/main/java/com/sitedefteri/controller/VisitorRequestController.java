package com.sitedefteri.controller;

import com.sitedefteri.dto.request.CreateVisitorRequestRequest;
import com.sitedefteri.dto.request.ReviewVisitorRequestRequest;
import com.sitedefteri.dto.response.VisitorRequestResponse;
import com.sitedefteri.security.JwtTokenProvider;
import com.sitedefteri.service.VisitorRequestService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/visitor-requests")
@RequiredArgsConstructor
public class VisitorRequestController {
    
    private final VisitorRequestService visitorRequestService;
    private final JwtTokenProvider jwtTokenProvider;
    
    // Resident endpoints
    @PreAuthorize("hasAnyRole('RESIDENT', 'ADMIN', 'SUPER_ADMIN')")
    @PostMapping
    public ResponseEntity<VisitorRequestResponse> createRequest(
            @Valid @RequestBody CreateVisitorRequestRequest request,
            HttpServletRequest httpRequest) {
        String userId = getUserIdFromRequest(httpRequest);
        VisitorRequestResponse response = visitorRequestService.createVisitorRequest(userId, request);
        return ResponseEntity.ok(response);
    }
    
    @PreAuthorize("hasAnyRole('RESIDENT', 'ADMIN', 'SUPER_ADMIN')")
    @GetMapping("/my")
    public ResponseEntity<List<VisitorRequestResponse>> getMyRequests(HttpServletRequest httpRequest) {
        String userId = getUserIdFromRequest(httpRequest);
        List<VisitorRequestResponse> requests = visitorRequestService.getMyRequests(userId);
        return ResponseEntity.ok(requests);
    }
    
    @PreAuthorize("hasAnyRole('RESIDENT', 'ADMIN', 'SUPER_ADMIN', 'SECURITY')")
    @GetMapping("/{id}")
    public ResponseEntity<VisitorRequestResponse> getRequestById(@PathVariable String id) {
        VisitorRequestResponse response = visitorRequestService.getRequestById(id);
        return ResponseEntity.ok(response);
    }
    
    @PreAuthorize("hasAnyRole('RESIDENT', 'ADMIN', 'SUPER_ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancelRequest(
            @PathVariable String id,
            HttpServletRequest httpRequest) {
        String userId = getUserIdFromRequest(httpRequest);
        visitorRequestService.cancelRequest(id, userId);
        return ResponseEntity.noContent().build();
    }
    
    // Security/Admin endpoints
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'SECURITY')")
    @GetMapping
    public ResponseEntity<List<VisitorRequestResponse>> getAllRequests(
            @RequestParam(required = false) String siteId,
            HttpServletRequest httpRequest) {
        // If siteId not provided, use user's site
        if (siteId == null || siteId.isEmpty()) {
            String userId = getUserIdFromRequest(httpRequest);
            siteId = visitorRequestService.getUserSiteId(userId);
        }
        List<VisitorRequestResponse> requests = visitorRequestService.getAllRequests(siteId);
        return ResponseEntity.ok(requests);
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'SECURITY')")
    @GetMapping("/pending")
    public ResponseEntity<List<VisitorRequestResponse>> getPendingRequests(
            @RequestParam(required = false) String siteId,
            HttpServletRequest httpRequest) {
        // If siteId not provided, use user's site
        if (siteId == null || siteId.isEmpty()) {
            String userId = getUserIdFromRequest(httpRequest);
            siteId = visitorRequestService.getUserSiteId(userId);
        }
        List<VisitorRequestResponse> requests = visitorRequestService.getPendingRequests(siteId);
        return ResponseEntity.ok(requests);
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'SECURITY')")
    @PutMapping("/{id}/approve")
    public ResponseEntity<VisitorRequestResponse> approveRequest(
            @PathVariable String id,
            @RequestBody(required = false) ReviewVisitorRequestRequest request,
            HttpServletRequest httpRequest) {
        String userId = getUserIdFromRequest(httpRequest);
        ReviewVisitorRequestRequest reviewRequest = request != null ? request : new ReviewVisitorRequestRequest();
        VisitorRequestResponse response = visitorRequestService.approveRequest(id, userId, reviewRequest);
        return ResponseEntity.ok(response);
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'SECURITY')")
    @PutMapping("/{id}/reject")
    public ResponseEntity<VisitorRequestResponse> rejectRequest(
            @PathVariable String id,
            @RequestBody(required = false) ReviewVisitorRequestRequest request,
            HttpServletRequest httpRequest) {
        String userId = getUserIdFromRequest(httpRequest);
        ReviewVisitorRequestRequest reviewRequest = request != null ? request : new ReviewVisitorRequestRequest();
        VisitorRequestResponse response = visitorRequestService.rejectRequest(id, userId, reviewRequest);
        return ResponseEntity.ok(response);
    }
    
    private String getUserIdFromRequest(HttpServletRequest request) {
        String token = request.getHeader("Authorization");
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        return jwtTokenProvider.getUserIdFromToken(token);
    }
}
