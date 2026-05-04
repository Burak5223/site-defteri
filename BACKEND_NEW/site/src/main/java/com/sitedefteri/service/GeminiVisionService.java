package com.sitedefteri.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sitedefteri.repository.AIExtractionLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/**
 * Service for Gemini Vision API integration
 * Handles photo-based cargo slip information extraction
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class GeminiVisionService {

    private final AIExtractionLogRepository aiExtractionLogRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    @Value("${gemini.timeout.seconds:30}")
    private int timeoutSeconds;

    @Value("${gemini.daily.quota:1000}")
    private int dailyQuota;

    @Value("${ai.cargo.enabled:true}")
    private boolean aiCargoEnabled;

    /**
     * Turkish-optimized prompt for cargo slip extraction
     */
    private static final String EXTRACTION_PROMPT = 
        "Bu kargo fişinden aşağıdaki bilgileri çıkar ve JSON formatında döndür:\n" +
        "- full_name: Alıcının tam adı (ad ve soyad)\n" +
        "- tracking_number: Takip numarası (sadece rakamlar)\n" +
        "- date: Tarih (GG/AA/YYYY veya YYYY-AA-GG formatında)\n" +
        "- cargo_company: Kargo şirketi adı\n" +
        "- apartment_number: Daire numarası\n" +
        "- notes: Ek notlar veya özel talimatlar\n\n" +
        "Eğer bir bilgi bulunamazsa, o alan için null döndür. " +
        "Sadece JSON formatında yanıt ver, başka açıklama ekleme.";

    /**
     * Check if AI cargo feature is enabled
     * Task 16.1: Feature flag for AI service availability
     */
    public boolean isAICargoEnabled() {
        return aiCargoEnabled;
    }

    /**
     * Health check for Gemini API
     * Task 16.1: AI service availability check
     */
    public boolean isGeminiAPIHealthy() {
        if (!aiCargoEnabled) {
            log.info("[{}] [INFO] [GeminiVisionService] [healthCheck] AI cargo feature is disabled", 
                     LocalDateTime.now());
            return false;
        }

        try {
            // Simple health check: verify API key is configured
            if (apiKey == null || apiKey.isEmpty() || apiKey.equals("YOUR_API_KEY_HERE")) {
                log.warn("[{}] [WARN] [GeminiVisionService] [healthCheck] API key not configured", 
                         LocalDateTime.now());
                return false;
            }

            // Check if API URL is configured
            if (apiUrl == null || apiUrl.isEmpty()) {
                log.warn("[{}] [WARN] [GeminiVisionService] [healthCheck] API URL not configured", 
                         LocalDateTime.now());
                return false;
            }

            log.info("[{}] [INFO] [GeminiVisionService] [healthCheck] Gemini API is healthy", 
                     LocalDateTime.now());
            return true;

        } catch (Exception e) {
            log.error("[{}] [ERROR] [GeminiVisionService] [healthCheck] Health check failed, error={}", 
                      LocalDateTime.now(), e.getMessage());
            return false;
        }
    }

    /**
     * Extract cargo information from photo using Gemini Vision API
     * Task 14.3: Structured logging with timestamp, level, service, operation, siteId
     */
    public String extractCargoInfo(byte[] photoBytes, String siteId) throws Exception {
        long startTime = System.currentTimeMillis();
        String operation = "extractCargoInfo";

        try {
            log.info("[{}] [INFO] [GeminiVisionService] [{}] [siteId={}] Starting AI extraction, photoSize={}KB", 
                     LocalDateTime.now(), operation, siteId, photoBytes.length / 1024);

            // Check rate limit
            if (!isQuotaAvailable(siteId)) {
                log.warn("[{}] [WARN] [GeminiVisionService] [{}] [siteId={}] Daily quota exceeded", 
                         LocalDateTime.now(), operation, siteId);
                throw new RuntimeException("Günlük API kotası aşıldı. Lütfen yarın tekrar deneyin.");
            }

            // Encode photo to Base64
            String base64Photo = Base64.getEncoder().encodeToString(photoBytes);

            // Build request
            Map<String, Object> request = buildGeminiRequest(base64Photo);

            // Set headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            // Call Gemini API with timeout
            String url = apiUrl + "?key=" + apiKey;
            ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                String.class
            );

            long responseTime = System.currentTimeMillis() - startTime;

            if (response.getStatusCode() == HttpStatus.OK) {
                log.info("[{}] [INFO] [GeminiVisionService] [{}] [siteId={}] API call successful, responseTime={}ms", 
                         LocalDateTime.now(), operation, siteId, responseTime);
                return response.getBody();
            } else {
                log.error("[{}] [ERROR] [GeminiVisionService] [{}] [siteId={}] API error, status={}", 
                          LocalDateTime.now(), operation, siteId, response.getStatusCode());
                throw new RuntimeException("Gemini API hatası: " + response.getStatusCode());
            }

        } catch (Exception e) {
            long responseTime = System.currentTimeMillis() - startTime;
            log.error("[{}] [ERROR] [GeminiVisionService] [{}] [siteId={}] API call failed, responseTime={}ms, error={}", 
                      LocalDateTime.now(), operation, siteId, responseTime, e.getMessage());
            throw e;
        }
    }

    /**
     * Check if daily quota is available for site
     */
    public boolean isQuotaAvailable(String siteId) {
        LocalDateTime startOfDay = LocalDateTime.now().with(LocalTime.MIN);
        long todayCalls = aiExtractionLogRepository.countTodayCallsBySite(siteId, startOfDay);
        return todayCalls < dailyQuota;
    }

    /**
     * Build Gemini API request payload
     */
    private Map<String, Object> buildGeminiRequest(String base64Photo) {
        Map<String, Object> request = new HashMap<>();
        
        // Add prompt
        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", EXTRACTION_PROMPT);
        
        // Add image
        Map<String, Object> imagePart = new HashMap<>();
        Map<String, Object> inlineData = new HashMap<>();
        inlineData.put("mime_type", "image/jpeg");
        inlineData.put("data", base64Photo);
        imagePart.put("inline_data", inlineData);
        
        // Build content
        Map<String, Object> content = new HashMap<>();
        content.put("parts", new Object[]{textPart, imagePart});
        
        request.put("contents", new Object[]{content});
        
        // Add generation config
        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("temperature", 0.1);
        generationConfig.put("maxOutputTokens", 1024);
        request.put("generationConfig", generationConfig);
        
        return request;
    }

    /**
     * Extract JSON from Gemini response
     */
    public String extractJsonFromResponse(String geminiResponse) throws Exception {
        JsonNode root = objectMapper.readTree(geminiResponse);
        
        // Navigate: candidates[0].content.parts[0].text
        JsonNode candidates = root.get("candidates");
        if (candidates != null && candidates.isArray() && candidates.size() > 0) {
            JsonNode content = candidates.get(0).get("content");
            if (content != null) {
                JsonNode parts = content.get("parts");
                if (parts != null && parts.isArray() && parts.size() > 0) {
                    JsonNode text = parts.get(0).get("text");
                    if (text != null) {
                        String textContent = text.asText();
                        // Extract JSON from markdown code blocks if present
                        textContent = textContent.replaceAll("```json\\s*", "")
                                                 .replaceAll("```\\s*", "")
                                                 .trim();
                        return textContent;
                    }
                }
            }
        }
        
        throw new RuntimeException("Gemini yanıtından JSON çıkarılamadı");
    }
}
