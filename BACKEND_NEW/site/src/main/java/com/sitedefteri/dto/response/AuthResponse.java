package com.sitedefteri.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    private String userId;
    private String siteId;
    private List<String> roles;
    private List<String> permissions;
    private UserResponse user;
    
    public AuthResponse(String accessToken, String userId, List<String> roles, UserResponse user) {
        this.accessToken = accessToken;
        this.tokenType = "Bearer";
        this.userId = userId;
        this.roles = roles;
        this.user = user;
        this.refreshToken = ""; // TODO: Implement refresh token
        this.siteId = ""; // TODO: Get from user's site
        this.permissions = List.of(); // TODO: Get from user's permissions
    }
}
