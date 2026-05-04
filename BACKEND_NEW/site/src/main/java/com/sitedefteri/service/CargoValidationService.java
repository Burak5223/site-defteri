package com.sitedefteri.service;

import com.sitedefteri.dto.cargo.CargoFormData;
import com.sitedefteri.dto.cargo.ValidationResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.regex.Pattern;

/**
 * Service for validating cargo form data
 */
@Service
@Slf4j
public class CargoValidationService {

    // Validation regex patterns
    private static final Pattern FULL_NAME_PATTERN = Pattern.compile("^[A-Za-zçğıöşüÇĞİÖŞÜ ]+$");
    private static final Pattern TRACKING_NUMBER_PATTERN = Pattern.compile("^\\d+$");
    private static final Pattern DATE_PATTERN_1 = Pattern.compile("^\\d{2}/\\d{2}/\\d{4}$"); // DD/MM/YYYY
    private static final Pattern DATE_PATTERN_2 = Pattern.compile("^\\d{4}-\\d{2}-\\d{2}$"); // YYYY-MM-DD
    private static final Pattern APARTMENT_NUMBER_PATTERN = Pattern.compile("^[A-Za-z0-9\\-/]+$");

    /**
     * Validate complete cargo form data
     * Task 14.3: Structured logging
     */
    public ValidationResult validateCargoForm(CargoFormData formData) {
        String operation = "validateCargoForm";
        ValidationResult result = new ValidationResult();

        log.info("[{}] [INFO] [CargoValidationService] [{}] Starting validation", 
                 LocalDateTime.now(), operation);

        // Validate required fields
        if (formData.getFullName() == null || formData.getFullName().trim().isEmpty()) {
            result.addError("fullName", "Alıcı adı zorunludur");
            log.warn("[{}] [WARN] [CargoValidationService] [{}] Validation failed: fullName is empty", 
                     LocalDateTime.now(), operation);
        } else if (!validateFullName(formData.getFullName())) {
            result.addError("fullName", "Alıcı adı sadece harf ve boşluk içerebilir");
            log.warn("[{}] [WARN] [CargoValidationService] [{}] Validation failed: fullName invalid format", 
                     LocalDateTime.now(), operation);
        }

        if (formData.getTrackingNumber() == null || formData.getTrackingNumber().trim().isEmpty()) {
            result.addError("trackingNumber", "Takip numarası zorunludur");
            log.warn("[{}] [WARN] [CargoValidationService] [{}] Validation failed: trackingNumber is empty", 
                     LocalDateTime.now(), operation);
        } else if (!validateTrackingNumber(formData.getTrackingNumber())) {
            result.addError("trackingNumber", "Takip numarası sadece rakam içermelidir");
            log.warn("[{}] [WARN] [CargoValidationService] [{}] Validation failed: trackingNumber invalid format", 
                     LocalDateTime.now(), operation);
        }

        if (formData.getDate() == null || formData.getDate().trim().isEmpty()) {
            result.addError("date", "Tarih zorunludur");
            log.warn("[{}] [WARN] [CargoValidationService] [{}] Validation failed: date is empty", 
                     LocalDateTime.now(), operation);
        } else if (!validateDate(formData.getDate())) {
            result.addError("date", "Tarih formatı geçersiz (GG/AA/YYYY veya YYYY-AA-GG olmalı)");
            log.warn("[{}] [WARN] [CargoValidationService] [{}] Validation failed: date invalid format", 
                     LocalDateTime.now(), operation);
        }

        // Validate optional fields if provided
        if (formData.getApartmentNumber() != null && !formData.getApartmentNumber().trim().isEmpty()) {
            if (!validateApartmentNumber(formData.getApartmentNumber())) {
                result.addError("apartmentNumber", "Daire numarası geçersiz format");
                log.warn("[{}] [WARN] [CargoValidationService] [{}] Validation failed: apartmentNumber invalid format", 
                         LocalDateTime.now(), operation);
            }
        }

        log.info("[{}] [INFO] [CargoValidationService] [{}] Validation complete, valid={}, errorCount={}", 
                 LocalDateTime.now(), operation, result.isValid(), result.getFieldErrors().size());
        
        return result;
    }

    /**
     * Validate full name field
     */
    public boolean validateFullName(String fullName) {
        if (fullName == null || fullName.trim().isEmpty()) {
            return false;
        }
        return FULL_NAME_PATTERN.matcher(fullName.trim()).matches();
    }

    /**
     * Validate tracking number field
     */
    public boolean validateTrackingNumber(String trackingNumber) {
        if (trackingNumber == null || trackingNumber.trim().isEmpty()) {
            return false;
        }
        return TRACKING_NUMBER_PATTERN.matcher(trackingNumber.trim()).matches();
    }

    /**
     * Validate date field (supports DD/MM/YYYY and YYYY-MM-DD)
     */
    public boolean validateDate(String date) {
        if (date == null || date.trim().isEmpty()) {
            return false;
        }
        String trimmed = date.trim();
        return DATE_PATTERN_1.matcher(trimmed).matches() || 
               DATE_PATTERN_2.matcher(trimmed).matches();
    }

    /**
     * Validate apartment number field
     */
    public boolean validateApartmentNumber(String apartmentNumber) {
        if (apartmentNumber == null || apartmentNumber.trim().isEmpty()) {
            return true; // Optional field
        }
        return APARTMENT_NUMBER_PATTERN.matcher(apartmentNumber.trim()).matches();
    }

    /**
     * Validate individual field
     */
    public ValidationResult validateField(String fieldName, String value) {
        ValidationResult result = new ValidationResult();

        switch (fieldName) {
            case "fullName":
                if (!validateFullName(value)) {
                    result.addError(fieldName, "Alıcı adı sadece harf ve boşluk içerebilir");
                }
                break;
            case "trackingNumber":
                if (!validateTrackingNumber(value)) {
                    result.addError(fieldName, "Takip numarası sadece rakam içermelidir");
                }
                break;
            case "date":
                if (!validateDate(value)) {
                    result.addError(fieldName, "Tarih formatı geçersiz");
                }
                break;
            case "apartmentNumber":
                if (!validateApartmentNumber(value)) {
                    result.addError(fieldName, "Daire numarası geçersiz format");
                }
                break;
            default:
                log.warn("Unknown field name for validation: {}", fieldName);
        }

        return result;
    }
}
