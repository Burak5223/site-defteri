package com.sitedefteri.controller;

import com.sitedefteri.dto.request.CreateApartmentRequest;
import com.sitedefteri.dto.response.ApartmentResponse;
import com.sitedefteri.service.ApartmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ApartmentController {
    
    private final ApartmentService apartmentService;
    
    /**
     * Get apartments by site
     * GET /api/sites/{siteId}/apartments
     */
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'RESIDENT', 'SECURITY', 'CLEANING')")
    @GetMapping("/sites/{siteId}/apartments")
    public ResponseEntity<List<ApartmentResponse>> getApartmentsBySite(@PathVariable String siteId) {
        return ResponseEntity.ok(apartmentService.getApartmentsBySite(siteId));
    }
    
    /**
     * Get all apartments (for Super Admin)
     * GET /api/apartments
     */
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'RESIDENT', 'SECURITY', 'CLEANING')")
    @GetMapping("/apartments")
    public ResponseEntity<List<ApartmentResponse>> getAllApartments() {
        // Get all apartments from all sites
        return ResponseEntity.ok(apartmentService.getAllApartments());
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'RESIDENT', 'SECURITY', 'CLEANING')")
    @GetMapping("/blocks/{blockId}/apartments")
    public ResponseEntity<List<ApartmentResponse>> getApartments(@PathVariable String blockId) {
        return ResponseEntity.ok(apartmentService.getApartmentsByBlock(blockId));
    }
    
    /**
     * Get apartments with residents by block
     * GET /api/blocks/{blockId}/apartments-with-residents
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'RESIDENT', 'SECURITY', 'CLEANING')")
    @GetMapping("/blocks/{blockId}/apartments-with-residents")
    public ResponseEntity<List<ApartmentResponse>> getApartmentsWithResidents(@PathVariable String blockId) {
        return ResponseEntity.ok(apartmentService.getApartmentsWithResidentsByBlock(blockId));
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'RESIDENT', 'SECURITY', 'CLEANING')")
    @GetMapping("/blocks/{blockId}/apartments/{id}")
    public ResponseEntity<ApartmentResponse> getApartment(
            @PathVariable String blockId,
            @PathVariable String id) {
        return ResponseEntity.ok(apartmentService.getApartmentById(id));
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/blocks/{blockId}/apartments")
    public ResponseEntity<ApartmentResponse> createApartment(
            @PathVariable String blockId,
            @Valid @RequestBody CreateApartmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(apartmentService.createApartment(blockId, request));
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/blocks/{blockId}/apartments/{id}")
    public ResponseEntity<ApartmentResponse> updateApartment(
            @PathVariable String blockId,
            @PathVariable String id,
            @Valid @RequestBody CreateApartmentRequest request) {
        return ResponseEntity.ok(apartmentService.updateApartment(id, request));
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/blocks/{blockId}/apartments/{id}")
    public ResponseEntity<Map<String, String>> deleteApartment(
            @PathVariable String blockId,
            @PathVariable String id) {
        apartmentService.deleteApartment(id);
        return ResponseEntity.ok(Map.of("message", "Daire başarıyla silindi"));
    }
}
