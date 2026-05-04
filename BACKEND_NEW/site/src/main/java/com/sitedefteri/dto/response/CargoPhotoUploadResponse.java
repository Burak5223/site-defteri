package com.sitedefteri.dto.response;

import com.sitedefteri.dto.cargo.CargoFormData;
import com.sitedefteri.dto.cargo.ValidationResult;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for cargo photo upload with AI extraction
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CargoPhotoUploadResponse {
    private boolean success;
    private String message;
    private CargoFormData extractedData;
    private ValidationResult validationResult;
    private Long aiExtractionLogId;
    private Integer apiResponseTimeMs;
    private String errorCode; // For client-side error handling

    public static CargoPhotoUploadResponse success(
            CargoFormData data, 
            ValidationResult validation, 
            Long logId, 
            Integer responseTime) {
        CargoPhotoUploadResponse response = new CargoPhotoUploadResponse();
        response.setSuccess(true);
        response.setMessage("Fotoğraf başarıyla işlendi");
        response.setExtractedData(data);
        response.setValidationResult(validation);
        response.setAiExtractionLogId(logId);
        response.setApiResponseTimeMs(responseTime);
        return response;
    }

    public static CargoPhotoUploadResponse error(String message, String errorCode) {
        CargoPhotoUploadResponse response = new CargoPhotoUploadResponse();
        response.setSuccess(false);
        response.setMessage(message);
        response.setErrorCode(errorCode);
        return response;
    }
}
