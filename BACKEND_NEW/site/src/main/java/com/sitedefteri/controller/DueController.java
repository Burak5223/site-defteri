package com.sitedefteri.controller;

import com.sitedefteri.dto.request.BulkDueRequest;
import com.sitedefteri.dto.request.CreateDueRequest;
import com.sitedefteri.dto.response.DueResponse;
import com.sitedefteri.security.JwtTokenProvider;
import com.sitedefteri.service.DueService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class DueController {
    
    private final DueService dueService;
    private final JwtTokenProvider jwtTokenProvider;
    
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'RESIDENT')")
    @GetMapping("/sites/{siteId}/dues")
    public ResponseEntity<List<DueResponse>> getAllDues(@PathVariable String siteId) {
        return ResponseEntity.ok(dueService.getDuesBySite(siteId));
    }
    
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'RESIDENT')")
    @GetMapping("/dues")
    public ResponseEntity<List<DueResponse>> getAllDuesSimple() {
        log.info("Fetching all dues");
        return ResponseEntity.ok(dueService.getAllDues());
    }
    
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'RESIDENT')")
    @GetMapping("/apartments/{apartmentId}/dues")
    public ResponseEntity<List<DueResponse>> getDuesByApartment(@PathVariable String apartmentId) {
        return ResponseEntity.ok(dueService.getDuesByApartment(apartmentId));
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'RESIDENT')")
    @GetMapping("/dues/my")
    public ResponseEntity<List<DueResponse>> getMyDues(HttpServletRequest request) {
        // Get user ID from JWT token
        String token = jwtTokenProvider.getTokenFromRequest(request);
        String userId = jwtTokenProvider.getUserIdFromToken(token);
        
        log.info("Fetching dues for user: {}", userId);
        return ResponseEntity.ok(dueService.getDuesByUserId(userId));
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'RESIDENT')")
    @PostMapping("/sites/{siteId}/dues")
    public ResponseEntity<DueResponse> createDue(
            @PathVariable String siteId,
            @Valid @RequestBody CreateDueRequest request) {
        return ResponseEntity.ok(dueService.createDue(request));
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'RESIDENT')")
    @PostMapping("/dues")
    public ResponseEntity<DueResponse> createDueSimple(@Valid @RequestBody CreateDueRequest request) {
        return ResponseEntity.ok(dueService.createDue(request));
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'RESIDENT')")
    @PostMapping("/dues/bulk")
    public ResponseEntity<List<DueResponse>> createBulkDues(@Valid @RequestBody BulkDueRequest request) {
        List<DueResponse> responses = request.getApartmentIds().stream()
                .map(apartmentId -> {
                    CreateDueRequest dueRequest = new CreateDueRequest();
                    dueRequest.setApartmentId(apartmentId);
                    dueRequest.setAmount(request.getAmount());
                    dueRequest.setDueDate(request.getDueDate());
                    dueRequest.setDescription(request.getDescription());
                    return dueService.createDue(dueRequest);
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'RESIDENT')")
    @PostMapping("/sites/{siteId}/dues/bulk")
    public ResponseEntity<List<DueResponse>> createBulkDuesWithSiteId(
            @PathVariable String siteId,
            @Valid @RequestBody BulkDueRequest request) {
        List<DueResponse> responses = request.getApartmentIds().stream()
                .map(apartmentId -> {
                    CreateDueRequest dueRequest = new CreateDueRequest();
                    dueRequest.setApartmentId(apartmentId);
                    dueRequest.setAmount(request.getAmount());
                    dueRequest.setDueDate(request.getDueDate());
                    dueRequest.setDescription(request.getDescription());
                    return dueService.createDue(dueRequest);
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/dues/{dueId}/status")
    public ResponseEntity<DueResponse> updateDueStatus(
            @PathVariable String dueId,
            @RequestParam String status) {
        return ResponseEntity.ok(dueService.updateDueStatus(dueId, status));
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'RESIDENT')")
    @GetMapping("/dues/{dueId}")
    public ResponseEntity<DueResponse> getDueDetail(@PathVariable String dueId) {
        return ResponseEntity.ok(dueService.getDueById(dueId));
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/dues/{dueId}")
    public ResponseEntity<DueResponse> updateDue(
            @PathVariable String dueId,
            @Valid @RequestBody CreateDueRequest request) {
        return ResponseEntity.ok(dueService.updateDue(dueId, request));
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/dues/{dueId}")
    public ResponseEntity<Void> deleteDue(@PathVariable String dueId) {
        dueService.deleteDue(dueId);
        return ResponseEntity.noContent().build();
    }
}
