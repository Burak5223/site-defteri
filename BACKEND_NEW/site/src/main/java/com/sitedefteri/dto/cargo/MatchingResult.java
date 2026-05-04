package com.sitedefteri.dto.cargo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for cargo matching result
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchingResult {
    private boolean matched;
    private Long notificationId;
    private String residentId;
    private String apartmentId;
    private String residentQrId;
    private String message;

    public static MatchingResult noMatch(String message) {
        MatchingResult result = new MatchingResult();
        result.setMatched(false);
        result.setMessage(message);
        return result;
    }

    public static MatchingResult success(Long notificationId, String residentId, 
                                        String apartmentId, String residentQrId, String message) {
        MatchingResult result = new MatchingResult();
        result.setMatched(true);
        result.setNotificationId(notificationId);
        result.setResidentId(residentId);
        result.setApartmentId(apartmentId);
        result.setResidentQrId(residentQrId);
        result.setMessage(message);
        return result;
    }
}
