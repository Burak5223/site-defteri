package com.sitedefteri.security;

import com.sitedefteri.exception.UnauthorizedException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Component
@RequiredArgsConstructor
public class SecurityUtils {
    
    private final JwtTokenProvider jwtTokenProvider;
    
    private String getTokenFromCurrentRequest() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            return jwtTokenProvider.getTokenFromRequest(request);
        }
        return null;
    }
    
    public String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof String) {
            return (String) auth.getPrincipal();
        }
        throw new UnauthorizedException("Kullanıcı bilgisi bulunamadı");
    }
    
    public String getCurrentUserSiteId() {
        String token = getTokenFromCurrentRequest();
        if (token != null) {
            String siteId = jwtTokenProvider.getSiteIdFromToken(token);
            if (siteId != null) {
                return siteId;
            }
        }
        // Fallback: default site
        return "1";
    }
    
    public String getCurrentUserRole() {
        String token = getTokenFromCurrentRequest();
        if (token != null) {
            String role = jwtTokenProvider.getRoleFromToken(token);
            if (role != null) {
                return role;
            }
        }
        // Fallback: default role
        return "ROLE_RESIDENT";
    }
    
    public String getCurrentUserEmail() {
        String token = getTokenFromCurrentRequest();
        if (token != null) {
            String email = jwtTokenProvider.getEmailFromToken(token);
            if (email != null) {
                return email;
            }
        }
        return null;
    }
    
    public boolean isAdmin() {
        return "ROLE_ADMIN".equals(getCurrentUserRole());
    }
    
    public boolean isResident() {
        return "ROLE_RESIDENT".equals(getCurrentUserRole());
    }
    
    public boolean isSecurity() {
        return "ROLE_SECURITY".equals(getCurrentUserRole());
    }
}
