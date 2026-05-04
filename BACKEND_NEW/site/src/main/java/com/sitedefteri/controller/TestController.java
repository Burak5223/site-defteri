package com.sitedefteri.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TestController {
    
    private final PasswordEncoder passwordEncoder;
    
    @GetMapping("/test")
    public ResponseEntity<Map<String, String>> test() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "Backend is running!");
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/test/bcrypt")
    public ResponseEntity<Map<String, String>> testBcrypt(@RequestParam String password) {
        Map<String, String> response = new HashMap<>();
        String hash = passwordEncoder.encode(password);
        response.put("password", password);
        response.put("hash", hash);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/test/verify")
    public ResponseEntity<Map<String, Object>> verifyPassword(
            @RequestParam String password,
            @RequestParam String hash) {
        Map<String, Object> response = new HashMap<>();
        boolean matches = passwordEncoder.matches(password, hash);
        response.put("password", password);
        response.put("hash", hash);
        response.put("matches", matches);
        return ResponseEntity.ok(response);
    }
}
