package com.sitedefteri.controller;

import com.sitedefteri.dto.request.CreatePaymentRequest;
import com.sitedefteri.dto.response.BankAccountResponse;
import com.sitedefteri.dto.response.PaymentResponse;
import com.sitedefteri.security.JwtTokenProvider;
import com.sitedefteri.service.BankAccountService;
import com.sitedefteri.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PaymentController {
    
    private final PaymentService paymentService;
    private final BankAccountService bankAccountService;
    private final JwtTokenProvider jwtTokenProvider;
    
    // Ödeme işleme (Kart, Sanal POS, Havale, Nakit)
    @PreAuthorize("hasAnyRole('ADMIN', 'RESIDENT')")
    @PostMapping("/payments/process")
    public ResponseEntity<PaymentResponse> processPayment(
            @Valid @RequestBody CreatePaymentRequest request,
            HttpServletRequest httpRequest) {
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String userId = jwtTokenProvider.getUserIdFromToken(token);
        return ResponseEntity.ok(paymentService.processPayment(request, userId));
    }
    
    // Ödeme oluşturma (eski endpoint - geriye dönük uyumluluk)
    @PreAuthorize("hasAnyRole('ADMIN', 'RESIDENT')")
    @PostMapping("/payments")
    public ResponseEntity<PaymentResponse> createPayment(
            @Valid @RequestBody CreatePaymentRequest request,
            HttpServletRequest httpRequest) {
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String userId = jwtTokenProvider.getUserIdFromToken(token);
        return ResponseEntity.ok(paymentService.createPayment(request, userId));
    }
    
    // Kullanıcının ödemeleri
    @PreAuthorize("hasAnyRole('ADMIN', 'RESIDENT')")
    @GetMapping("/payments/my-payments")
    public ResponseEntity<List<PaymentResponse>> getMyPayments(HttpServletRequest httpRequest) {
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String userId = jwtTokenProvider.getUserIdFromToken(token);
        return ResponseEntity.ok(paymentService.getPaymentsByUser(userId));
    }
    
    // Ödeme detayı
    @PreAuthorize("hasAnyRole('ADMIN', 'RESIDENT')")
    @GetMapping("/payments/{paymentId}")
    public ResponseEntity<PaymentResponse> getPaymentById(
            @PathVariable String paymentId,
            HttpServletRequest httpRequest) {
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String userId = jwtTokenProvider.getUserIdFromToken(token);
        return ResponseEntity.ok(paymentService.getPaymentById(paymentId, userId));
    }
    
    // Ödeme iptal etme
    @PreAuthorize("hasAnyRole('ADMIN', 'RESIDENT')")
    @PostMapping("/payments/{paymentId}/cancel")
    public ResponseEntity<PaymentResponse> cancelPayment(
            @PathVariable String paymentId,
            HttpServletRequest httpRequest) {
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String userId = jwtTokenProvider.getUserIdFromToken(token);
        return ResponseEntity.ok(paymentService.cancelPayment(paymentId, userId));
    }
    
    // Site banka hesap bilgileri
    @PreAuthorize("hasAnyRole('ADMIN', 'RESIDENT')")
    @GetMapping("/sites/{siteId}/bank-account")
    public ResponseEntity<BankAccountResponse> getSiteBankAccount(@PathVariable String siteId) {
        return ResponseEntity.ok(bankAccountService.getSiteBankAccount(siteId));
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/sites/{siteId}/payments/pending")
    public ResponseEntity<List<PaymentResponse>> getPendingPayments(@PathVariable String siteId) {
        return ResponseEntity.ok(paymentService.getPendingPayments(siteId));
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'RESIDENT')")
    @GetMapping("/sites/{siteId}/payments")
    public ResponseEntity<List<PaymentResponse>> getAllPayments(@PathVariable String siteId) {
        return ResponseEntity.ok(paymentService.getPaymentsBySite(siteId));
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/payments/{paymentId}/approve")
    public ResponseEntity<PaymentResponse> approvePayment(
            @PathVariable String paymentId,
            HttpServletRequest httpRequest) {
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String adminId = jwtTokenProvider.getUserIdFromToken(token);
        return ResponseEntity.ok(paymentService.approvePayment(paymentId, adminId));
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/payments/{paymentId}/reject")
    public ResponseEntity<PaymentResponse> rejectPayment(
            @PathVariable String paymentId,
            @RequestParam String reason,
            HttpServletRequest httpRequest) {
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String adminId = jwtTokenProvider.getUserIdFromToken(token);
        return ResponseEntity.ok(paymentService.rejectPayment(paymentId, adminId, reason));
    }
}
