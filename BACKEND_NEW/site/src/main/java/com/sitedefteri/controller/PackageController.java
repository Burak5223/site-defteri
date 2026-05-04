package com.sitedefteri.controller;

import com.sitedefteri.dto.request.CreatePackageRequest;
import com.sitedefteri.dto.request.DeliverPackageRequest;
import com.sitedefteri.dto.response.PackageResponse;
import com.sitedefteri.security.JwtTokenProvider;
import com.sitedefteri.service.PackageService;
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
public class PackageController {
    
    private final PackageService packageService;
    private final JwtTokenProvider jwtTokenProvider;
    
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'SECURITY', 'CLEANING')")
    @GetMapping("/packages")
    public ResponseEntity<List<PackageResponse>> getAllPackagesSimple() {
        return ResponseEntity.ok(packageService.getAllPackages());
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'SECURITY', 'CLEANING', 'RESIDENT')")
    @GetMapping("/packages/{packageId}")
    public ResponseEntity<PackageResponse> getPackageById(@PathVariable String packageId) {
        return ResponseEntity.ok(packageService.getPackageById(packageId));
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'SECURITY', 'CLEANING')")
    @GetMapping("/sites/{siteId}/packages")
    public ResponseEntity<List<PackageResponse>> getAllPackages(@PathVariable String siteId) {
        return ResponseEntity.ok(packageService.getPackagesBySite(siteId));
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'SECURITY', 'CLEANING', 'RESIDENT')")
    @GetMapping("/apartments/{apartmentId}/packages")
    public ResponseEntity<List<PackageResponse>> getPackagesByApartment(@PathVariable String apartmentId) {
        return ResponseEntity.ok(packageService.getPackagesByApartment(apartmentId));
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'SECURITY', 'CLEANING')")
    @GetMapping("/blocks/{blockId}/packages")
    public ResponseEntity<List<PackageResponse>> getPackagesByBlock(@PathVariable String blockId) {
        return ResponseEntity.ok(packageService.getPackagesByBlock(blockId));
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'SECURITY', 'CLEANING')")
    @PostMapping("/packages")
    public ResponseEntity<PackageResponse> createPackageSimple(@Valid @RequestBody CreatePackageRequest request) {
        return ResponseEntity.ok(packageService.createPackage(request));
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'SECURITY', 'CLEANING')")
    @PostMapping("/sites/{siteId}/packages")
    public ResponseEntity<PackageResponse> createPackage(
            @PathVariable String siteId,
            @Valid @RequestBody CreatePackageRequest request) {
        request.setSiteId(siteId);
        return ResponseEntity.ok(packageService.createPackage(request));
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'SECURITY', 'CLEANING')")
    @PutMapping("/packages/{packageId}/deliver")
    public ResponseEntity<PackageResponse> deliverPackage(@PathVariable String packageId) {
        return ResponseEntity.ok(packageService.deliverPackage(packageId));
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'SECURITY', 'CLEANING')")
    @PutMapping("/packages/{packageId}/deliver-with-details")
    public ResponseEntity<PackageResponse> deliverPackageWithDetails(
            @PathVariable String packageId,
            @Valid @RequestBody DeliverPackageRequest request) {
        return ResponseEntity.ok(packageService.deliverPackageWithDetails(packageId, request));
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'SECURITY', 'CLEANING')")
    @PutMapping("/packages/{packageId}")
    public ResponseEntity<PackageResponse> updatePackage(
            @PathVariable String packageId,
            @Valid @RequestBody CreatePackageRequest request) {
        return ResponseEntity.ok(packageService.updatePackage(packageId, request));
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/packages/{packageId}")
    public ResponseEntity<Void> deletePackage(@PathVariable String packageId) {
        packageService.deletePackage(packageId);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Scan resident QR code to see their pending packages
     * Used by security personnel
     */
    @PreAuthorize("hasAnyRole('SECURITY', 'CLEANING', 'ADMIN')")
    @PostMapping("/packages/scan-resident-qr")
    public ResponseEntity<com.sitedefteri.dto.response.ScanQRResponse> scanResidentQR(
            @Valid @RequestBody com.sitedefteri.dto.request.ScanQRRequest request) {
        return ResponseEntity.ok(packageService.scanResidentQR(request.getUserToken()));
    }
    
    /**
     * Collect package using QR token
     * Used by resident to collect their package
     */
    @PreAuthorize("hasRole('RESIDENT')")
    @PostMapping("/packages/{packageId}/collect")
    public ResponseEntity<PackageResponse> collectPackage(
            @PathVariable String packageId,
            @Valid @RequestBody com.sitedefteri.dto.request.CollectPackageRequest request) {
        return ResponseEntity.ok(packageService.collectPackageWithQR(packageId, request.getQrToken()));
    }
    
    /**
     * Security initiates delivery (marks as pending resident confirmation)
     * Used by security personnel
     */
    @PreAuthorize("hasAnyRole('SECURITY', 'CLEANING', 'ADMIN')")
    @PostMapping("/packages/{packageId}/initiate-delivery")
    public ResponseEntity<PackageResponse> initiateDelivery(@PathVariable String packageId) {
        return ResponseEntity.ok(packageService.initiateDelivery(packageId));
    }
    
    /**
     * Security initiates delivery for multiple packages at once
     * Used by security personnel after scanning resident QR
     */
    @PreAuthorize("hasAnyRole('SECURITY', 'CLEANING', 'ADMIN')")
    @PostMapping("/packages/bulk-initiate-delivery")
    public ResponseEntity<List<PackageResponse>> bulkInitiateDelivery(
            @Valid @RequestBody com.sitedefteri.dto.request.BulkDeliveryRequest request) {
        return ResponseEntity.ok(packageService.bulkInitiateDelivery(request.getPackageIds()));
    }
    
    /**
     * Resident confirms package receipt
     * Used by resident to confirm they received the package
     */
    @PreAuthorize("hasRole('RESIDENT')")
    @PostMapping("/packages/{packageId}/confirm-receipt")
    public ResponseEntity<PackageResponse> confirmReceipt(@PathVariable String packageId) {
        return ResponseEntity.ok(packageService.confirmReceipt(packageId));
    }
    
    /**
     * Resident confirms receipt for multiple packages at once
     * Used by resident after seeing delivery modal
     */
    @PreAuthorize("hasRole('RESIDENT')")
    @PostMapping("/packages/bulk-confirm-receipt")
    public ResponseEntity<List<PackageResponse>> bulkConfirmReceipt(
            @Valid @RequestBody com.sitedefteri.dto.request.BulkConfirmRequest request) {
        return ResponseEntity.ok(packageService.bulkConfirmReceipt(request.getPackageIds()));
    }
    
    /**
     * Get packages pending resident confirmation
     * Used by resident to see packages waiting for their confirmation
     */
    @PreAuthorize("hasRole('RESIDENT')")
    @GetMapping("/packages/pending-confirmation")
    public ResponseEntity<List<PackageResponse>> getPendingConfirmation() {
        return ResponseEntity.ok(packageService.getPendingConfirmationForCurrentUser());
    }
    
    // ==================== AI CARGO REGISTRATION ENDPOINTS ====================
    
    /**
     * Upload cargo slip photo for AI extraction
     * Used by security personnel to extract cargo info from photo
     * Accepts base64-encoded image in JSON body (React Native compatible)
     */
    @PreAuthorize("hasAnyRole('SECURITY', 'ADMIN')")
    @PostMapping("/packages/upload-cargo-photo")
    public ResponseEntity<com.sitedefteri.dto.response.CargoPhotoUploadResponse> uploadCargoPhoto(
            @Valid @RequestBody com.sitedefteri.dto.request.UploadCargoPhotoRequest request) {
        return ResponseEntity.ok(packageService.uploadCargoPhoto(request));
    }
    
    /**
     * Save cargo with AI-extracted or manually entered data
     * Used by security personnel after photo processing or manual entry
     */
    @PreAuthorize("hasAnyRole('SECURITY', 'ADMIN')")
    @PostMapping("/packages/save-cargo")
    public ResponseEntity<com.sitedefteri.dto.response.SaveCargoResponse> saveCargo(
            @Valid @RequestBody com.sitedefteri.dto.request.SaveCargoRequest request) {
        return ResponseEntity.ok(packageService.saveCargo(request));
    }
    
    /**
     * Create resident cargo notification ("Kargom Var")
     * Used by residents to notify about expected cargo
     */
    @PreAuthorize("hasRole('RESIDENT')")
    @PostMapping("/packages/resident-notification")
    public ResponseEntity<com.sitedefteri.dto.response.ResidentNotificationResponse> createResidentNotification(
            @Valid @RequestBody com.sitedefteri.dto.request.ResidentNotificationRequest request,
            HttpServletRequest httpRequest) {
        // Get user info from JWT token
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String userId = jwtTokenProvider.getUserIdFromToken(token);
        String siteId = jwtTokenProvider.getSiteIdFromToken(token);
        
        // Populate request with user info from token and database
        request.setResidentId(userId);
        request.setSiteId(siteId);
        
        // Note: apartmentId and fullName will be populated by the service layer
        // from the User entity and residency_history table
        
        return ResponseEntity.ok(packageService.createResidentNotification(request));
    }
    
    /**
     * Get pending cargo notifications for a site
     * Used by security/admin to see which residents are expecting cargo
     */
    @PreAuthorize("hasAnyRole('SECURITY', 'ADMIN')")
    @GetMapping("/sites/{siteId}/cargo-notifications/pending")
    public ResponseEntity<List<com.sitedefteri.entity.ResidentCargoNotification>> getPendingNotifications(
            @PathVariable String siteId) {
        return ResponseEntity.ok(packageService.getPendingNotifications(siteId));
    }
    
    /**
     * Get resident's own cargo notifications
     * Used by residents to see their notification history
     */
    @PreAuthorize("hasRole('RESIDENT')")
    @GetMapping("/packages/my-notifications")
    public ResponseEntity<List<com.sitedefteri.entity.ResidentCargoNotification>> getMyNotifications() {
        return ResponseEntity.ok(packageService.getMyNotifications());
    }
}
