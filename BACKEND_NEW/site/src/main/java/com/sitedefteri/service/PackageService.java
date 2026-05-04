package com.sitedefteri.service;

import com.sitedefteri.dto.request.CreatePackageRequest;
import com.sitedefteri.dto.request.DeliverPackageRequest;
import com.sitedefteri.dto.response.PackageResponse;
import com.sitedefteri.entity.Package;
import com.sitedefteri.exception.ResourceNotFoundException;
import com.sitedefteri.repository.PackageRepository;
import com.sitedefteri.security.SecurityUtils;
import com.sitedefteri.util.PrivacyUtils;
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
public class PackageService {
    
    private final PackageRepository packageRepository;
    private final SecurityUtils securityUtils;
    private final PrivacyUtils privacyUtils;
    private final NotificationService notificationService;
    private final ApartmentService apartmentService;
    private final UserService userService;
    private final com.sitedefteri.repository.UserRepository userRepository;
    private final GeminiVisionService geminiVisionService;
    private final AIParserService aiParserService;
    private final CargoValidationService cargoValidationService;
    private final CargoMatchingService cargoMatchingService;
    private final com.sitedefteri.repository.AIExtractionLogRepository aiExtractionLogRepository;
    
    @Transactional(readOnly = true)
    public List<PackageResponse> getPackagesByApartment(String apartmentId) {
        log.info("Fetching packages for apartment: {}", apartmentId);
        return packageRepository.findByApartmentIdOrderByRecordedAtDesc(apartmentId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<PackageResponse> getAllPackages() {
        log.info("Fetching all packages");
        return packageRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<PackageResponse> getPackagesByBlock(String blockId) {
        log.info("Fetching packages for block: {}", blockId);
        return packageRepository.findByBlockIdOrderByRecordedAtDesc(blockId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<PackageResponse> getPackagesBySite(String siteId) {
        log.info("Fetching packages for site: {}", siteId);
        return packageRepository.findBySiteIdOrderByRecordedAtDesc(siteId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public PackageResponse getPackageById(String packageId) {
        log.info("Fetching package: {}", packageId);
        Package pkg = packageRepository.findById(packageId)
                .orElseThrow(() -> new ResourceNotFoundException("Kargo", "id", packageId));
        return toResponse(pkg);
    }
    
    @Transactional
    public PackageResponse createPackage(CreatePackageRequest request) {
        log.info("Creating package for apartment: {}", request.getApartmentId());
        
        String currentUserId = securityUtils.getCurrentUserId();
        
        Package pkg = new Package();
        pkg.setApartmentId(request.getApartmentId());
        
        // KVKK Uyumlu: Takip numarasını maskele ve hash'le
        if (request.getTrackingNumber() != null && !request.getTrackingNumber().isEmpty()) {
            pkg.setTrackingMasked(privacyUtils.maskTrackingNumber(request.getTrackingNumber()));
            pkg.setTrackingHash(privacyUtils.hashTrackingNumber(request.getTrackingNumber()));
            // Geçici: Eski alan için de set et (migration sonrası kaldırılacak)
            pkg.setTrackingNumber(request.getTrackingNumber());
        }
        
        pkg.setCourierName(request.getCourierName());
        pkg.setSenderName(request.getSenderName());
        pkg.setRecipientName(request.getRecipientName());
        pkg.setPackageSize(request.getPackageSize());
        pkg.setPackageType(request.getPackageSize()); // Geçici: packageType için
        pkg.setNotes(request.getNotes());
        pkg.setPhotoUrl(request.getPhotoUrl());
        pkg.setBlockId(request.getBlockId());
        pkg.setSiteId(request.getSiteId());
        pkg.setStatus("beklemede");
        pkg.setRecordedAt(LocalDateTime.now());
        
        // QR Token Oluştur (Güvenli Paket Teslimi)
        String qrToken = java.util.UUID.randomUUID().toString();
        pkg.setQrToken(qrToken);
        pkg.setQrTokenCreatedAt(LocalDateTime.now());
        pkg.setQrTokenExpiresAt(LocalDateTime.now().plusDays(7)); // 7 gün geçerli
        pkg.setQrTokenUsed(false);
        log.info("QR token created for package: {}", qrToken);
        
        // KVKK Uyumlu: Rol bazlı kayıt (kişi değil)
        pkg.setReceivedByRole("SECURITY");
        
        // Audit için user_id (sadece admin görebilir)
        pkg.setRecordedBy(currentUserId);
        
        Package saved = packageRepository.save(pkg);
        log.info("Package created with ID: {} (KVKK compliant)", saved.getId());
        
        // Otomatik bildirim gönder (hata olsa bile paket kaydedilir)
        try {
            notificationService.notifyPackageReceived(saved);
            log.info("Package received notification sent for package: {}", saved.getId());
        } catch (Exception e) {
            log.warn("Failed to send package notification (package was saved successfully): {}", e.getMessage());
        }
        
        return toResponse(saved);
    }
    
    @Transactional
    public PackageResponse deliverPackage(String packageId) {
        log.info("Delivering package: {}", packageId);
        
        Package pkg = packageRepository.findById(packageId)
                .orElseThrow(() -> new ResourceNotFoundException("Kargo", "id", packageId));
        
        pkg.setStatus("teslim_edildi");
        pkg.setDeliveredAt(LocalDateTime.now());
        pkg.setDeliveredByRole("SECURITY");
        
        Package updated = packageRepository.save(pkg);
        
        // Otomatik bildirim gönder
        try {
            notificationService.notifyPackageDelivered(updated);
            log.info("Package delivered notification sent for package: {}", updated.getId());
        } catch (Exception e) {
            log.error("Failed to send delivery notification, but package was updated", e);
        }
        
        return toResponse(updated);
    }
    
    @Transactional
    public PackageResponse deliverPackageWithDetails(String packageId, DeliverPackageRequest request) {
        log.info("Delivering package with details: {}", packageId);
        
        Package pkg = packageRepository.findById(packageId)
                .orElseThrow(() -> new ResourceNotFoundException("Kargo", "id", packageId));
        
        pkg.setStatus("teslim_edildi");
        pkg.setDeliveredAt(LocalDateTime.now());
        pkg.setDeliveredTo(request.getDeliveredTo());
        pkg.setDeliveryPhotoUrl(request.getDeliveryPhotoUrl());
        pkg.setDeliverySignatureUrl(request.getDeliverySignatureUrl());
        
        // KVKK Uyumlu: Rol bazlı teslim
        pkg.setDeliveredByRole("SECURITY");
        
        if (request.getNotes() != null && !request.getNotes().isEmpty()) {
            String existingNotes = pkg.getNotes() != null ? pkg.getNotes() + "\n" : "";
            pkg.setNotes(existingNotes + "Teslim Notu: " + request.getNotes());
        }
        
        Package updated = packageRepository.save(pkg);
        log.info("Package delivered with details (KVKK compliant): {}", updated.getId());
        
        // Otomatik bildirim gönder
        try {
            notificationService.notifyPackageDelivered(updated);
            log.info("Package delivered notification sent for package: {}", updated.getId());
        } catch (Exception e) {
            log.error("Failed to send delivery notification, but package was updated", e);
        }
        
        return toResponse(updated);
    }
    
    @Transactional
    public PackageResponse updatePackage(String packageId, CreatePackageRequest request) {
        log.info("Updating package: {}", packageId);
        
        Package pkg = packageRepository.findById(packageId)
                .orElseThrow(() -> new ResourceNotFoundException("Kargo", "id", packageId));
        
        if (request.getTrackingNumber() != null) {
            pkg.setTrackingMasked(privacyUtils.maskTrackingNumber(request.getTrackingNumber()));
            pkg.setTrackingHash(privacyUtils.hashTrackingNumber(request.getTrackingNumber()));
            pkg.setTrackingNumber(request.getTrackingNumber());
        }
        if (request.getCourierName() != null) {
            pkg.setCourierName(request.getCourierName());
        }
        if (request.getSenderName() != null) {
            pkg.setSenderName(request.getSenderName());
        }
        if (request.getRecipientName() != null) {
            pkg.setRecipientName(request.getRecipientName());
        }
        if (request.getPackageSize() != null) {
            pkg.setPackageSize(request.getPackageSize());
            pkg.setPackageType(request.getPackageSize());
        }
        if (request.getNotes() != null) {
            pkg.setNotes(request.getNotes());
        }
        if (request.getPhotoUrl() != null) {
            pkg.setPhotoUrl(request.getPhotoUrl());
        }
        
        Package updated = packageRepository.save(pkg);
        log.info("Package updated: {}", packageId);
        return toResponse(updated);
    }
    
    @Transactional
    public void deletePackage(String packageId) {
        log.info("Deleting package: {}", packageId);
        
        Package pkg = packageRepository.findById(packageId)
                .orElseThrow(() -> new ResourceNotFoundException("Kargo", "id", packageId));
        
        packageRepository.delete(pkg);
        log.info("Package deleted: {}", packageId);
    }
    
    /**
     * KVKK Uyumlu Response Oluşturma
     * Kişisel veriler (recorded_by, delivered_to) dahil edilmez
     */
    private PackageResponse toResponse(Package pkg) {
        PackageResponse response = new PackageResponse();
        response.setId(pkg.getId());
        response.setApartmentId(pkg.getApartmentId());
        response.setBlockId(pkg.getBlockId());
        response.setSiteId(pkg.getSiteId());
        
        // Apartment bilgisini çek
        try {
            var apartment = apartmentService.getApartmentById(pkg.getApartmentId());
            response.setApartmentNumber(apartment.getUnitNumber());
            response.setBlockName(apartment.getBlockName());
        } catch (Exception e) {
            log.warn("Could not fetch apartment info for package {}: {}", pkg.getId(), e.getMessage());
            // Fallback: apartmentId'yi daire numarası olarak kullan
            response.setApartmentNumber("Daire " + pkg.getApartmentId());
            response.setBlockName("Bilinmiyor");
        }
        
        // KVKK Uyumlu: Maskeli takip numarası (herkes için)
        response.setTrackingMasked(pkg.getTrackingMasked());
        
        // KVKK Uyumlu: Tam takip numarası (sadece SECURITY ve ADMIN için)
        try {
            String currentRole = securityUtils.getCurrentUserRole();
            if ("ROLE_SECURITY".equals(currentRole) || "ROLE_ADMIN".equals(currentRole) || "ROLE_SUPER_ADMIN".equals(currentRole)) {
                response.setTrackingNumber(pkg.getTrackingNumber());
                log.debug("Full tracking number provided for role: {}", currentRole);
            } else {
                response.setTrackingNumber(null);  // RESIDENT sees only masked
                log.debug("Tracking number masked for role: {}", currentRole);
            }
        } catch (Exception e) {
            // If role cannot be determined, default to masked only
            response.setTrackingNumber(null);
            log.warn("Could not determine user role, defaulting to masked tracking number");
        }
        
        response.setCourierName(pkg.getCourierName());
        response.setSenderName(pkg.getSenderName());
        response.setRecipientName(pkg.getRecipientName());
        response.setPackageSize(pkg.getPackageSize());
        response.setPackageType(pkg.getPackageType());
        response.setStatus(pkg.getStatus() != null ? pkg.getStatus() : "received");
        response.setNotes(pkg.getNotes());
        response.setPhotoUrl(pkg.getPhotoUrl());
        response.setDeliveryPhotoUrl(pkg.getDeliveryPhotoUrl());
        response.setDeliverySignatureUrl(pkg.getDeliverySignatureUrl());
        
        // QR Token (Güvenli Paket Teslimi)
        response.setQrToken(pkg.getQrToken());
        response.setQrTokenExpiresAt(pkg.getQrTokenExpiresAt());
        response.setQrTokenUsed(pkg.getQrTokenUsed());
        
        // KVKK Uyumlu: Rol bazlı bilgi (kişi değil)
        response.setReceivedByRole(pkg.getReceivedByRole());
        response.setDeliveredByRole(pkg.getDeliveredByRole());
        
        response.setRecordedAt(pkg.getRecordedAt());
        response.setArrivalDate(pkg.getRecordedAt());  // Geliş tarihi = kayıt tarihi
        response.setDeliveredAt(pkg.getDeliveredAt());
        response.setNotifiedAt(pkg.getNotifiedAt());
        response.setNotifyConversationId(pkg.getNotifyConversationId());
        
        // AI Cargo Registration fields
        response.setAiExtracted(pkg.getAiExtracted());
        response.setAiExtractionLogId(pkg.getAiExtractionLogId());
        response.setMatchedNotificationId(pkg.getMatchedNotificationId());
        
        // NOT: recorded_by ve delivered_to dahil edilmez (KVKK)
        // Sadece admin endpoint'inde gösterilir
        
        return response;
    }
    
    /**
     * Scan resident QR code and get their pending packages
     * Used by security to see which packages belong to a resident
     */
    @Transactional(readOnly = true)
    public com.sitedefteri.dto.response.ScanQRResponse scanResidentQR(String userToken) {
        log.info("Scanning resident QR token");
        
        // Find user by QR token
        com.sitedefteri.entity.User user = userService.findByQRToken(userToken);
        log.info("Found user: {} for QR token", user.getFullName());
        
        // Get user's apartment
        String apartmentId = getUserApartmentId(user.getId());
        if (apartmentId == null) {
            throw new com.sitedefteri.exception.BadRequestException("Kullanıcının dairesi bulunamadı");
        }
        
        // Get pending packages for this apartment (both "beklemede" and "waiting" status)
        List<Package> beklemedePkgs = packageRepository.findByApartmentIdAndStatus(apartmentId, "beklemede");
        List<Package> waitingPkgs = packageRepository.findByApartmentIdAndStatus(apartmentId, "waiting");
        
        // Combine both lists
        List<Package> packages = new java.util.ArrayList<>();
        packages.addAll(beklemedePkgs);
        packages.addAll(waitingPkgs);
        
        log.info("Found {} pending packages for apartment: {} (beklemede: {}, waiting: {})", 
                 packages.size(), apartmentId, beklemedePkgs.size(), waitingPkgs.size());
        
        // Count AI-registered packages
        long aiPackageCount = packages.stream().filter(p -> p.getAiExtracted() != null && p.getAiExtracted()).count();
        log.info("AI-registered packages: {}/{}", aiPackageCount, packages.size());
        
        // Build response
        com.sitedefteri.dto.response.ScanQRResponse response = new com.sitedefteri.dto.response.ScanQRResponse();
        response.setUserId(user.getId());
        response.setFullName(user.getFullName());
        response.setApartmentId(apartmentId);
        
        // Get apartment details
        try {
            var apartment = apartmentService.getApartmentById(apartmentId);
            response.setApartmentNumber(apartment.getUnitNumber());
            response.setBlockName(apartment.getBlockName());
        } catch (Exception e) {
            log.warn("Could not fetch apartment info: {}", e.getMessage());
        }
        
        response.setPackages(packages.stream().map(this::toResponse).collect(java.util.stream.Collectors.toList()));
        response.setPackageCount(packages.size());
        
        return response;
    }
    
    /**
     * Collect package using QR token
     * Used by resident to collect their package
     */
    @Transactional
    public PackageResponse collectPackageWithQR(String packageId, String qrToken) {
        log.info("Collecting package {} with QR token", packageId);
        
        String currentUserId = securityUtils.getCurrentUserId();
        
        // Get package
        Package pkg = packageRepository.findById(packageId)
                .orElseThrow(() -> new ResourceNotFoundException("Kargo", "id", packageId));
        
        // Validate QR token
        if (pkg.getQrToken() == null || !pkg.getQrToken().equals(qrToken)) {
            throw new com.sitedefteri.exception.BadRequestException("QR kodu geçersiz");
        }
        
        // Check if token is expired
        if (pkg.getQrTokenExpiresAt() != null && pkg.getQrTokenExpiresAt().isBefore(LocalDateTime.now())) {
            throw new com.sitedefteri.exception.BadRequestException("QR kodunun süresi dolmuş");
        }
        
        // Check if token is already used
        if (pkg.getQrTokenUsed() != null && pkg.getQrTokenUsed()) {
            throw new com.sitedefteri.exception.BadRequestException("Bu QR kodu zaten kullanılmış");
        }
        
        // Check if package is already delivered
        if ("teslim_edildi".equals(pkg.getStatus())) {
            throw new com.sitedefteri.exception.BadRequestException("Paket zaten teslim edilmiş");
        }
        
        // Verify user belongs to the apartment
        String userApartmentId = getUserApartmentId(currentUserId);
        if (userApartmentId == null || !userApartmentId.equals(pkg.getApartmentId())) {
            throw new com.sitedefteri.exception.BadRequestException("Bu paket sizin dairenize ait değil");
        }
        
        // Mark package as delivered
        pkg.setStatus("teslim_edildi");
        pkg.setDeliveredAt(LocalDateTime.now());
        pkg.setQrTokenUsed(true);
        pkg.setDeliveredByRole("RESIDENT");
        
        Package updated = packageRepository.save(pkg);
        log.info("Package collected successfully with QR: {}", packageId);
        
        // Send notification
        try {
            notificationService.notifyPackageDelivered(updated);
        } catch (Exception e) {
            log.error("Failed to send delivery notification", e);
        }
        
        return toResponse(updated);
    }
    
    /**
     * Helper: Get user's apartment ID
     */
    private String getUserApartmentId(String userId) {
        try {
            // Query residency_history to find active apartment
            var apartments = packageRepository.findUserActiveApartment(userId);
            if (!apartments.isEmpty()) {
                return apartments.get(0);
            }
        } catch (Exception e) {
            log.warn("Could not find apartment for user {}: {}", userId, e.getMessage());
        }
        return null;
    }
    
    /**
     * Security initiates delivery (marks as pending resident confirmation)
     */
    @Transactional
    public PackageResponse initiateDelivery(String packageId) {
        log.info("Security initiating delivery for package: {}", packageId);
        
        Package pkg = packageRepository.findById(packageId)
                .orElseThrow(() -> new ResourceNotFoundException("Kargo", "id", packageId));
        
        // Check if package is waiting
        if (!"beklemede".equals(pkg.getStatus()) && !"waiting".equals(pkg.getStatus())) {
            throw new com.sitedefteri.exception.BadRequestException("Paket beklemede durumunda değil");
        }
        
        // Log if this is AI-registered cargo
        if (pkg.getAiExtracted() != null && pkg.getAiExtracted()) {
            log.info("Initiating delivery for AI-registered package: {}", packageId);
        }
        
        // Mark as pending confirmation
        pkg.setStatus("teslim_bekliyor");
        pkg.setDeliveredByRole("SECURITY");
        
        Package updated = packageRepository.save(pkg);
        log.info("Package marked as pending confirmation: {}", packageId);
        
        // Send notification to resident (hata olsa bile paket güncellenir)
        try {
            notificationService.notifyPackageAwaitingConfirmation(updated);
            log.info("Confirmation notification sent for package: {}", packageId);
        } catch (Exception e) {
            log.warn("Failed to send confirmation notification (package was updated successfully): {}", e.getMessage());
        }
        
        return toResponse(updated);
    }
    
    /**
     * Security initiates delivery for multiple packages at once
     */
    @Transactional
    public List<PackageResponse> bulkInitiateDelivery(List<String> packageIds) {
        log.info("Security initiating bulk delivery for {} packages", packageIds.size());
        
        List<PackageResponse> responses = new java.util.ArrayList<>();
        
        for (String packageId : packageIds) {
            try {
                PackageResponse response = initiateDelivery(packageId);
                responses.add(response);
            } catch (Exception e) {
                log.error("Failed to initiate delivery for package {}: {}", packageId, e.getMessage());
                // Continue with other packages
            }
        }
        
        log.info("Bulk delivery initiated for {}/{} packages", responses.size(), packageIds.size());
        return responses;
    }
    
    /**
     * Resident confirms package receipt
     */
    @Transactional
    public PackageResponse confirmReceipt(String packageId) {
        log.info("Resident confirming receipt for package: {}", packageId);
        
        String currentUserId = securityUtils.getCurrentUserId();
        
        Package pkg = packageRepository.findById(packageId)
                .orElseThrow(() -> new ResourceNotFoundException("Kargo", "id", packageId));
        
        // Check if package is pending confirmation
        if (!"teslim_bekliyor".equals(pkg.getStatus())) {
            throw new com.sitedefteri.exception.BadRequestException("Paket onay beklemede durumunda değil");
        }
        
        // Verify user belongs to the apartment
        String userApartmentId = getUserApartmentId(currentUserId);
        if (userApartmentId == null || !userApartmentId.equals(pkg.getApartmentId())) {
            throw new com.sitedefteri.exception.BadRequestException("Bu paket sizin dairenize ait değil");
        }
        
        // Mark as delivered
        pkg.setStatus("teslim_edildi");
        pkg.setDeliveredAt(LocalDateTime.now());
        
        Package updated = packageRepository.save(pkg);
        log.info("Package receipt confirmed: {}", packageId);
        
        // Send final notification (hata olsa bile paket güncellenir)
        try {
            notificationService.notifyPackageDelivered(updated);
        } catch (Exception e) {
            log.warn("Failed to send delivery notification (package was updated successfully): {}", e.getMessage());
        }
        
        return toResponse(updated);
    }
    
    /**
     * Resident confirms receipt for multiple packages at once
     */
    @Transactional
    public List<PackageResponse> bulkConfirmReceipt(List<String> packageIds) {
        log.info("Resident confirming bulk receipt for {} packages", packageIds.size());
        
        List<PackageResponse> responses = new java.util.ArrayList<>();
        
        for (String packageId : packageIds) {
            try {
                PackageResponse response = confirmReceipt(packageId);
                responses.add(response);
            } catch (Exception e) {
                log.error("Failed to confirm receipt for package {}: {}", packageId, e.getMessage());
                // Continue with other packages
            }
        }
        
        log.info("Bulk receipt confirmed for {}/{} packages", responses.size(), packageIds.size());
        return responses;
    }
    
    /**
     * Get packages pending confirmation for current user
     */
    @Transactional(readOnly = true)
    public List<PackageResponse> getPendingConfirmationForCurrentUser() {
        String currentUserId = securityUtils.getCurrentUserId();
        String apartmentId = getUserApartmentId(currentUserId);
        
        if (apartmentId == null) {
            return java.util.Collections.emptyList();
        }
        
        List<Package> packages = packageRepository.findByApartmentIdAndStatus(apartmentId, "teslim_bekliyor");
        log.info("Found {} packages pending confirmation for user: {}", packages.size(), currentUserId);
        
        return packages.stream()
                .map(this::toResponse)
                .collect(java.util.stream.Collectors.toList());
    }
    
    // ==================== AI CARGO REGISTRATION METHODS ====================
    
    /**
     * Upload cargo photo and extract information using Gemini Vision API
     * Task 16.1: Check AI service availability before processing
     * Task 16.2: Return manual entry fallback when AI unavailable
     * Task 16.3: Handle partial extraction
     * Accepts base64-encoded image (React Native compatible)
     */
    @Transactional
    public com.sitedefteri.dto.response.CargoPhotoUploadResponse uploadCargoPhoto(
            com.sitedefteri.dto.request.UploadCargoPhotoRequest request) {
        
        log.info("Processing cargo photo upload for site: {}", request.getSiteId());
        
        try {
            // Task 16.1: Check if AI service is available
            if (!geminiVisionService.isAICargoEnabled()) {
                log.warn("AI cargo feature is disabled, returning manual entry fallback");
                return com.sitedefteri.dto.response.CargoPhotoUploadResponse.error(
                    "AI servisi şu anda kullanılamıyor, manuel giriş yapabilirsiniz", 
                    "AI_DISABLED");
            }

            if (!geminiVisionService.isGeminiAPIHealthy()) {
                log.warn("Gemini API health check failed, returning manual entry fallback");
                return com.sitedefteri.dto.response.CargoPhotoUploadResponse.error(
                    "AI servisi şu anda kullanılamıyor, manuel giriş yapabilirsiniz", 
                    "AI_UNHEALTHY");
            }

            // Validate base64 image
            if (request.getPhotoBase64() == null || request.getPhotoBase64().isEmpty()) {
                return com.sitedefteri.dto.response.CargoPhotoUploadResponse.error(
                    "Fotoğraf boş olamaz", "EMPTY_FILE");
            }
            
            // Decode base64 to bytes
            byte[] photoBytes;
            try {
                // Remove data URI prefix if present (e.g., "data:image/jpeg;base64,")
                String base64Data = request.getPhotoBase64();
                if (base64Data.contains(",")) {
                    base64Data = base64Data.split(",")[1];
                }
                photoBytes = java.util.Base64.getDecoder().decode(base64Data);
            } catch (IllegalArgumentException e) {
                log.error("Invalid base64 format: {}", e.getMessage());
                return com.sitedefteri.dto.response.CargoPhotoUploadResponse.error(
                    "Geçersiz fotoğraf formatı", "INVALID_BASE64");
            }
            
            // Check file size (10MB max)
            if (photoBytes.length > 10 * 1024 * 1024) {
                return com.sitedefteri.dto.response.CargoPhotoUploadResponse.error(
                    "Fotoğraf boyutu çok büyük (maksimum 10MB)", "FILE_TOO_LARGE");
            }
            
            log.info("Photo decoded successfully, size: {} bytes", photoBytes.length);
            
            long startTime = System.currentTimeMillis();
            
            // Call Gemini Vision API
            String geminiResponse = geminiVisionService.extractCargoInfo(photoBytes, request.getSiteId());
            
            int responseTime = (int) (System.currentTimeMillis() - startTime);
            
            // Extract JSON from response
            String jsonResponse = geminiVisionService.extractJsonFromResponse(geminiResponse);
            
            // Parse to CargoFormData
            com.sitedefteri.dto.cargo.CargoFormData formData = 
                aiParserService.parseGeminiResponse(jsonResponse);
            
            // Task 16.3: Check if extraction is partial
            boolean isPartial = aiParserService.isPartialExtraction(formData);
            String[] missingFields = aiParserService.getMissingRequiredFields(formData);
            
            // Validate extracted data
            com.sitedefteri.dto.cargo.ValidationResult validation = 
                cargoValidationService.validateCargoForm(formData);
            
            // Save extraction log
            com.sitedefteri.entity.AIExtractionLog extractionLog = new com.sitedefteri.entity.AIExtractionLog();
            extractionLog.setSiteId(request.getSiteId());
            extractionLog.setSecurityUserId(request.getSecurityUserId());
            extractionLog.setPhotoPath("base64_upload_" + System.currentTimeMillis() + ".jpg");
            extractionLog.setGeminiRawResponse(geminiResponse);
            extractionLog.setExtractionSuccess(!isPartial); // Mark as success only if not partial
            extractionLog.setApiResponseTimeMs(responseTime);
            if (isPartial) {
                extractionLog.setErrorMessage("Partial extraction: missing fields - " + String.join(", ", missingFields));
            }
            
            com.sitedefteri.entity.AIExtractionLog savedLog = aiExtractionLogRepository.save(extractionLog);
            
            formData.setAiExtractionLogId(savedLog.getId());
            
            if (isPartial) {
                log.warn("Partial cargo extraction. Missing fields: {}", String.join(", ", missingFields));
            } else {
                log.info("Cargo photo processed successfully. Response time: {}ms", responseTime);
            }
            
            return com.sitedefteri.dto.response.CargoPhotoUploadResponse.success(
                formData, validation, savedLog.getId(), responseTime);
            
        } catch (Exception e) {
            log.error("Error processing cargo photo: {}", e.getMessage(), e);
            
            // Save error log
            try {
                com.sitedefteri.entity.AIExtractionLog errorLog = new com.sitedefteri.entity.AIExtractionLog();
                errorLog.setSiteId(request.getSiteId());
                errorLog.setSecurityUserId(request.getSecurityUserId());
                errorLog.setPhotoPath("base64_upload_error_" + System.currentTimeMillis() + ".jpg");
                errorLog.setExtractionSuccess(false);
                errorLog.setErrorMessage(e.getMessage());
                aiExtractionLogRepository.save(errorLog);
            } catch (Exception logError) {
                log.error("Failed to save error log: {}", logError.getMessage());
            }
            
            // Task 16.2: Return manual entry fallback
            return com.sitedefteri.dto.response.CargoPhotoUploadResponse.error(
                "AI servisi şu anda kullanılamıyor, manuel giriş yapabilirsiniz",
                "AI_SERVICE_ERROR");
        }
    }
    
    /**
     * Save cargo with AI-extracted or manually entered data
     */
    @Transactional
    public com.sitedefteri.dto.response.SaveCargoResponse saveCargo(
            com.sitedefteri.dto.request.SaveCargoRequest request) {
        
        log.info("Saving cargo for site: {}", request.getSiteId());
        
        try {
            // Final validation
            com.sitedefteri.dto.cargo.CargoFormData formData = new com.sitedefteri.dto.cargo.CargoFormData();
            formData.setFullName(request.getFullName());
            formData.setTrackingNumber(request.getTrackingNumber());
            formData.setDate(request.getDate());
            formData.setCargoCompany(request.getCargoCompany());
            formData.setApartmentNumber(request.getApartmentNumber());
            formData.setNotes(request.getNotes());
            
            com.sitedefteri.dto.cargo.ValidationResult validation = 
                cargoValidationService.validateCargoForm(formData);
            
            if (!validation.isValid()) {
                return com.sitedefteri.dto.response.SaveCargoResponse.error(
                    "Validasyon hatası: " + validation.getFieldErrors().toString());
            }
            
            // Try to match with resident notification
            com.sitedefteri.dto.cargo.MatchingResult matchingResult = 
                cargoMatchingService.matchWithResidentNotification(formData, request.getSiteId());
            
            // Find apartment ID from apartment number
            String apartmentId = null;
            if (request.getApartmentNumber() != null && !request.getApartmentNumber().isEmpty()) {
                try {
                    // Try to find apartment by unit number and site
                    var apartments = packageRepository.findApartmentByUnitNumberAndSite(
                        request.getApartmentNumber(), request.getSiteId());
                    if (!apartments.isEmpty()) {
                        apartmentId = apartments.get(0);
                        log.info("Found apartment ID: {} for unit number: {}", apartmentId, request.getApartmentNumber());
                    } else {
                        log.warn("No apartment found for unit number: {} in site: {}", 
                                request.getApartmentNumber(), request.getSiteId());
                    }
                } catch (Exception e) {
                    log.error("Error finding apartment: {}", e.getMessage());
                }
            }
            
            // Create package
            Package pkg = new Package();
            pkg.setSiteId(request.getSiteId());
            pkg.setRecipientName(request.getFullName());
            pkg.setCourierName(request.getCargoCompany());
            pkg.setNotes(request.getNotes());
            
            // KVKK: Mask and hash tracking number
            pkg.setTrackingMasked(privacyUtils.maskTrackingNumber(request.getTrackingNumber()));
            pkg.setTrackingHash(privacyUtils.hashTrackingNumber(request.getTrackingNumber()));
            pkg.setTrackingNumber(request.getTrackingNumber()); // Temporary
            
            // AI fields
            pkg.setAiExtracted(request.getAiExtracted() != null && request.getAiExtracted());
            pkg.setAiExtractionLogId(request.getAiExtractionLogId());
            
            // If matched, assign to resident's apartment
            if (matchingResult.isMatched()) {
                pkg.setApartmentId(matchingResult.getApartmentId());
                pkg.setMatchedNotificationId(matchingResult.getNotificationId());
                pkg.setStatus("waiting"); // Waiting for resident pickup
                
                // Generate unique QR token for this package (not resident's QR)
                // Resident's QR will be validated at collection time
                String packageQrToken = java.util.UUID.randomUUID().toString();
                pkg.setQrToken(packageQrToken);
                pkg.setQrTokenCreatedAt(LocalDateTime.now());
                pkg.setQrTokenExpiresAt(LocalDateTime.now().plusDays(7));
                pkg.setQrTokenUsed(false);
                
                log.info("Package matched with notification. Generated unique QR token: {}", packageQrToken);
            } else {
                // Not matched - use apartment ID from apartment number lookup
                if (apartmentId != null) {
                    pkg.setApartmentId(apartmentId);
                    pkg.setStatus("beklemede"); // Waiting for resident pickup (manual)
                    log.info("Package not matched, assigned to apartment: {}", apartmentId);
                } else {
                    // No apartment found - this is an error case
                    return com.sitedefteri.dto.response.SaveCargoResponse.error(
                        "Daire bulunamadı: " + request.getApartmentNumber() + 
                        ". Lütfen geçerli bir daire numarası girin.");
                }
            }
            
            pkg.setRecordedAt(LocalDateTime.now());
            pkg.setRecordedBy(request.getSecurityUserId());
            pkg.setReceivedByRole("SECURITY");
            
            Package saved = packageRepository.save(pkg);
            log.info("Cargo saved with ID: {}", saved.getId());
            
            // Send notification if matched (Task 14.2: Push notification for successful cargo match)
            if (matchingResult.isMatched()) {
                try {
                    notificationService.notifyCargoMatched(saved, matchingResult.getResidentId());
                    log.info("Cargo matched notification sent to resident: {}", matchingResult.getResidentId());
                } catch (Exception e) {
                    log.warn("Failed to send cargo matched notification: {}", e.getMessage());
                }
            }
            
            return com.sitedefteri.dto.response.SaveCargoResponse.success(
                saved.getId(), matchingResult, saved.getQrToken(), saved.getStatus());
            
        } catch (Exception e) {
            log.error("Error saving cargo: {}", e.getMessage(), e);
            return com.sitedefteri.dto.response.SaveCargoResponse.error(
                "Kargo kaydedilemedi: " + e.getMessage());
        }
    }
    
    /**
     * Create resident cargo notification ("Kargom Var")
     * Also creates a package record with status "requested" for tracking
     */
    @Transactional
    public com.sitedefteri.dto.response.ResidentNotificationResponse createResidentNotification(
            com.sitedefteri.dto.request.ResidentNotificationRequest request) {
        
        log.info("Creating resident notification for residentId: {}", request.getResidentId());
        
        try {
            // Fetch user information from database
            com.sitedefteri.entity.User user = userRepository.findById(request.getResidentId())
                .orElseThrow(() -> new com.sitedefteri.exception.ResourceNotFoundException(
                    "Kullanıcı", "id", request.getResidentId()));
            String fullName = user.getFullName();
            
            // Get user's apartment ID
            String apartmentId = getUserApartmentId(request.getResidentId());
            if (apartmentId == null) {
                throw new com.sitedefteri.exception.BadRequestException(
                    "Kullanıcının aktif dairesi bulunamadı. Lütfen yöneticinizle iletişime geçin.");
            }
            
            // Populate missing fields
            request.setApartmentId(apartmentId);
            request.setFullName(fullName);
            
            log.info("Request details - residentId: {}, siteId: {}, apartmentId: {}, fullName: {}, cargoCompany: {}, expectedDate: {}", 
                     request.getResidentId(), request.getSiteId(), request.getApartmentId(), 
                     request.getFullName(), request.getCargoCompany(), request.getExpectedDate());
            
            // 1. Create the notification record
            com.sitedefteri.entity.ResidentCargoNotification notification = 
                cargoMatchingService.createResidentNotification(
                    request.getResidentId(),
                    request.getSiteId(),
                    request.getApartmentId(),
                    request.getFullName(),
                    request.getCargoCompany(),
                    request.getExpectedDate()
                );
            
            log.info("Resident notification created with ID: {}", notification.getId());
            
            // 2. Create a package record with status "requested"
            // This will appear in SecurityPackages screen under "Bekleyen Talepler" tab
            Package pkg = new Package();
            pkg.setSiteId(request.getSiteId());
            pkg.setApartmentId(request.getApartmentId());
            pkg.setRecipientName(request.getFullName());
            pkg.setCourierName(request.getCargoCompany());
            pkg.setStatus("requested"); // Special status for resident requests
            pkg.setRecordedAt(LocalDateTime.now());
            pkg.setRecordedBy(request.getResidentId());
            pkg.setReceivedByRole("RESIDENT"); // Requested by resident
            pkg.setMatchedNotificationId(notification.getId()); // Link to notification
            
            // Add note about expected date if provided
            if (request.getExpectedDate() != null && !request.getExpectedDate().isEmpty()) {
                pkg.setNotes("Beklenen Tarih: " + request.getExpectedDate());
            }
            
            Package savedPackage = packageRepository.save(pkg);
            log.info("Package request record created with ID: {} for notification: {}", 
                     savedPackage.getId(), notification.getId());
            
            // 3. Send notification to security about the request
            try {
                notificationService.notifySecurityAboutCargoRequest(savedPackage, request.getFullName());
                log.info("Security notified about cargo request from: {}", request.getFullName());
            } catch (Exception e) {
                log.warn("Failed to send security notification (request was saved successfully): {}", e.getMessage());
            }
            
            return com.sitedefteri.dto.response.ResidentNotificationResponse.success(
                notification.getId(), notification.getCreatedAt());
            
        } catch (Exception e) {
            log.error("Error creating resident notification - Type: {}, Message: {}", 
                      e.getClass().getName(), e.getMessage());
            log.error("Full stack trace:", e);
            return com.sitedefteri.dto.response.ResidentNotificationResponse.error(
                "Bildirim oluşturulamadı: " + e.getMessage());
        }
    }
    
    /**
     * Get pending cargo notifications for a site
     */
    @Transactional(readOnly = true)
    public List<com.sitedefteri.entity.ResidentCargoNotification> getPendingNotifications(String siteId) {
        log.info("Fetching pending notifications for site: {}", siteId);
        return cargoMatchingService.getPendingNotifications(siteId);
    }
    
    /**
     * Get resident's own cargo notifications
     */
    @Transactional(readOnly = true)
    public List<com.sitedefteri.entity.ResidentCargoNotification> getMyNotifications() {
        String currentUserId = securityUtils.getCurrentUserId();
        log.info("Fetching notifications for user: {}", currentUserId);
        return cargoMatchingService.getResidentNotifications(currentUserId);
    }
}

