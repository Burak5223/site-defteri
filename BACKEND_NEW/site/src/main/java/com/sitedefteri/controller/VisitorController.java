package com.sitedefteri.controller;

import com.sitedefteri.dto.request.CreateVisitorRequest;
import com.sitedefteri.dto.response.VisitorResponse;
import com.sitedefteri.service.VisitorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class VisitorController {
    
    private final VisitorService visitorService;
    
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'SECURITY')")
    @GetMapping("/visitors")
    public ResponseEntity<List<VisitorResponse>> getAllVisitorsSimple() {
        return ResponseEntity.ok(visitorService.getAllVisitors());
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'SECURITY')")
    @GetMapping("/sites/{siteId}/visitors")
    public ResponseEntity<List<VisitorResponse>> getAllVisitors(@PathVariable String siteId) {
        return ResponseEntity.ok(visitorService.getAllVisitors());
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'SECURITY')")
    @GetMapping("/apartments/{apartmentId}/visitors")
    public ResponseEntity<List<VisitorResponse>> getVisitorsByApartment(@PathVariable String apartmentId) {
        return ResponseEntity.ok(visitorService.getVisitorsByApartment(apartmentId));
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'SECURITY')")
    @PostMapping("/visitors")
    public ResponseEntity<VisitorResponse> createVisitorSimple(@Valid @RequestBody CreateVisitorRequest request) {
        return ResponseEntity.ok(visitorService.createVisitor(request));
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'SECURITY')")
    @PostMapping("/sites/{siteId}/visitors")
    public ResponseEntity<VisitorResponse> createVisitor(
            @PathVariable String siteId,
            @Valid @RequestBody CreateVisitorRequest request) {
        return ResponseEntity.ok(visitorService.createVisitor(request));
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'SECURITY')")
    @PutMapping("/visitors/{visitorId}/checkin")
    public ResponseEntity<VisitorResponse> checkInVisitor(@PathVariable String visitorId) {
        return ResponseEntity.ok(visitorService.checkInVisitor(visitorId));
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'SECURITY')")
    @PutMapping("/visitors/{visitorId}/checkout")
    public ResponseEntity<VisitorResponse> checkOutVisitor(@PathVariable String visitorId) {
        return ResponseEntity.ok(visitorService.checkOutVisitor(visitorId));
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'SECURITY')")
    @PutMapping("/visitors/{visitorId}")
    public ResponseEntity<VisitorResponse> updateVisitor(
            @PathVariable String visitorId,
            @Valid @RequestBody CreateVisitorRequest request) {
        return ResponseEntity.ok(visitorService.updateVisitor(visitorId, request));
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'SECURITY')")
    @DeleteMapping("/visitors/{visitorId}")
    public ResponseEntity<Void> deleteVisitor(@PathVariable String visitorId) {
        visitorService.deleteVisitor(visitorId);
        return ResponseEntity.noContent().build();
    }
}
