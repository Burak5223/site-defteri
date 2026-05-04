package com.sitedefteri.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sitedefteri.dto.cargo.CargoFormData;
import com.sitedefteri.dto.cargo.GeminiExtractionResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Service for parsing and normalizing AI extraction results
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AIParserService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Turkish character normalization map for matching
     */
    private static final Map<Character, Character> TURKISH_CHAR_MAP = new HashMap<>();
    
    static {
        TURKISH_CHAR_MAP.put('ı', 'i');
        TURKISH_CHAR_MAP.put('İ', 'I');
        TURKISH_CHAR_MAP.put('ş', 's');
        TURKISH_CHAR_MAP.put('Ş', 'S');
        TURKISH_CHAR_MAP.put('ğ', 'g');
        TURKISH_CHAR_MAP.put('Ğ', 'G');
        TURKISH_CHAR_MAP.put('ü', 'u');
        TURKISH_CHAR_MAP.put('Ü', 'U');
        TURKISH_CHAR_MAP.put('ö', 'o');
        TURKISH_CHAR_MAP.put('Ö', 'O');
        TURKISH_CHAR_MAP.put('ç', 'c');
        TURKISH_CHAR_MAP.put('Ç', 'C');
    }

    /**
     * Parse Gemini JSON response to CargoFormData
     * Task 14.3: Structured logging
     */
    public CargoFormData parseGeminiResponse(String jsonResponse) throws Exception {
        String operation = "parseGeminiResponse";
        
        try {
            log.info("[{}] [INFO] [AIParserService] [{}] Starting JSON parsing", 
                     LocalDateTime.now(), operation);

            // Parse JSON to GeminiExtractionResponse
            GeminiExtractionResponse geminiResponse = objectMapper.readValue(
                jsonResponse, 
                GeminiExtractionResponse.class
            );

            // Convert to CargoFormData
            CargoFormData formData = new CargoFormData();
            formData.setFullName(geminiResponse.getFullName());
            formData.setTrackingNumber(geminiResponse.getTrackingNumber());
            formData.setDate(geminiResponse.getDate());
            formData.setCargoCompany(geminiResponse.getCargoCompany());
            formData.setApartmentNumber(geminiResponse.getApartmentNumber());
            formData.setNotes(geminiResponse.getNotes());
            formData.setAiExtracted(true);

            log.info("[{}] [INFO] [AIParserService] [{}] Parsing successful, fullName={}, tracking={}", 
                     LocalDateTime.now(), operation, formData.getFullName(), formData.getTrackingNumber());

            return formData;

        } catch (Exception e) {
            log.error("[{}] [ERROR] [AIParserService] [{}] Parsing failed, error={}", 
                      LocalDateTime.now(), operation, e.getMessage());
            throw new RuntimeException("AI yanıtı işlenemedi: " + e.getMessage(), e);
        }
    }

    /**
     * Normalize Turkish characters for case-insensitive matching
     * Example: "Şükrü Öztürk" -> "sukru ozturk"
     */
    public String normalizeTurkishCharacters(String text) {
        if (text == null || text.isEmpty()) {
            return text;
        }

        StringBuilder normalized = new StringBuilder();
        for (char c : text.toLowerCase().toCharArray()) {
            normalized.append(TURKISH_CHAR_MAP.getOrDefault(c, c));
        }

        return normalized.toString();
    }

    /**
     * Clean and normalize full name for matching
     */
    public String normalizeFullName(String fullName) {
        if (fullName == null || fullName.isEmpty()) {
            return "";
        }

        // Remove extra spaces
        String cleaned = fullName.trim().replaceAll("\\s+", " ");
        
        // Normalize Turkish characters
        return normalizeTurkishCharacters(cleaned);
    }

    /**
     * Extract only digits from tracking number
     */
    public String extractDigits(String trackingNumber) {
        if (trackingNumber == null) {
            return null;
        }
        return trackingNumber.replaceAll("[^0-9]", "");
    }

    /**
     * Check if extraction result is partial (some fields missing)
     * Task 16.3: Handle partial AI extraction
     */
    public boolean isPartialExtraction(CargoFormData formData) {
        int filledFields = 0;
        int requiredFields = 3; // fullName, trackingNumber, date

        if (formData.getFullName() != null && !formData.getFullName().isEmpty()) filledFields++;
        if (formData.getTrackingNumber() != null && !formData.getTrackingNumber().isEmpty()) filledFields++;
        if (formData.getDate() != null && !formData.getDate().isEmpty()) filledFields++;

        // Consider partial if less than all required fields are filled
        boolean isPartial = filledFields < requiredFields;
        
        if (isPartial) {
            log.warn("[{}] [WARN] [AIParserService] [isPartialExtraction] Partial extraction detected, filledFields={}/{}", 
                     LocalDateTime.now(), filledFields, requiredFields);
        }

        return isPartial;
    }

    /**
     * Get list of missing required fields
     * Task 16.3: Highlight missing fields for manual entry
     */
    public String[] getMissingRequiredFields(CargoFormData formData) {
        java.util.List<String> missing = new java.util.ArrayList<>();

        if (formData.getFullName() == null || formData.getFullName().isEmpty()) {
            missing.add("fullName");
        }
        if (formData.getTrackingNumber() == null || formData.getTrackingNumber().isEmpty()) {
            missing.add("trackingNumber");
        }
        if (formData.getDate() == null || formData.getDate().isEmpty()) {
            missing.add("date");
        }

        return missing.toArray(new String[0]);
    }
}
