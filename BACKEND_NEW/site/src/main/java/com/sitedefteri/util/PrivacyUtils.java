package com.sitedefteri.util;

import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * KVKK Uyumluluk için gizlilik yardımcı sınıfı
 * Takip numarası maskeleme ve hash işlemleri
 */
@Component
public class PrivacyUtils {
    
    /**
     * Takip numarasını maskele
     * Örnek: YK123456789 -> YK****789
     * 
     * @param trackingNumber Tam takip numarası
     * @return Maskeli takip numarası
     */
    public String maskTrackingNumber(String trackingNumber) {
        if (trackingNumber == null || trackingNumber.isEmpty()) {
            return null;
        }
        
        if (trackingNumber.length() < 6) {
            return "****";
        }
        
        int length = trackingNumber.length();
        String prefix = trackingNumber.substring(0, Math.min(2, length));
        String suffix = trackingNumber.substring(Math.max(0, length - 3));
        
        return prefix + "****" + suffix;
    }
    
    /**
     * Takip numarasının SHA-256 hash'ini oluştur
     * Doğrulama için kullanılır
     * 
     * @param trackingNumber Tam takip numarası
     * @return SHA-256 hash (hex string)
     */
    public String hashTrackingNumber(String trackingNumber) {
        if (trackingNumber == null || trackingNumber.isEmpty()) {
            return null;
        }
        
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(trackingNumber.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not found", e);
        }
    }
    
    /**
     * Takip numarasını doğrula
     * 
     * @param trackingNumber Doğrulanacak takip numarası
     * @param hash Kayıtlı hash değeri
     * @return true eğer eşleşiyorsa
     */
    public boolean verifyTrackingNumber(String trackingNumber, String hash) {
        if (trackingNumber == null || hash == null) {
            return false;
        }
        return hashTrackingNumber(trackingNumber).equals(hash);
    }
    
    /**
     * Byte array'i hex string'e çevir
     */
    private String bytesToHex(byte[] bytes) {
        StringBuilder result = new StringBuilder();
        for (byte b : bytes) {
            result.append(String.format("%02x", b));
        }
        return result.toString();
    }
    
    /**
     * Kullanıcı adını maskele (gerekirse)
     * Örnek: Ahmet Yılmaz -> A*** Y***
     */
    public String maskName(String name) {
        if (name == null || name.isEmpty()) {
            return null;
        }
        
        String[] parts = name.split("\\s+");
        StringBuilder masked = new StringBuilder();
        
        for (int i = 0; i < parts.length; i++) {
            if (i > 0) masked.append(" ");
            String part = parts[i];
            if (part.length() > 0) {
                masked.append(part.charAt(0)).append("***");
            }
        }
        
        return masked.toString();
    }
}
