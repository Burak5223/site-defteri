package com.sitedefteri.dto.response;

import com.sitedefteri.dto.cargo.MatchingResult;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for saving cargo
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SaveCargoResponse {
    private boolean success;
    private String message;
    private String packageId;
    private MatchingResult matchingResult;
    private String qrToken;
    private String status; // received, waiting, etc.
    private String deliveryCode; // Delivery code from matched notification

    public static SaveCargoResponse success(
            String packageId, 
            MatchingResult matching, 
            String qrToken,
            String status) {
        SaveCargoResponse response = new SaveCargoResponse();
        response.setSuccess(true);
        response.setMessage(matching.isMatched() ? 
            "Kargo kaydedildi ve sakinle eşleştirildi" : 
            "Kargo kaydedildi");
        response.setPackageId(packageId);
        response.setMatchingResult(matching);
        response.setQrToken(qrToken);
        response.setStatus(status);
        response.setDeliveryCode(matching.getDeliveryCode()); // Set delivery code from matching
        return response;
    }

    public static SaveCargoResponse error(String message) {
        SaveCargoResponse response = new SaveCargoResponse();
        response.setSuccess(false);
        response.setMessage(message);
        return response;
    }
}
