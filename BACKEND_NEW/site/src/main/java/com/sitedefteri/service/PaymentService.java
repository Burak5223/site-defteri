package com.sitedefteri.service;

import com.sitedefteri.dto.request.CreatePaymentRequest;
import com.sitedefteri.dto.response.PaymentResponse;
import com.sitedefteri.entity.Payment;
import com.sitedefteri.entity.Due;
import com.sitedefteri.entity.Income;
import com.sitedefteri.exception.ResourceNotFoundException;
import com.sitedefteri.exception.BadRequestException;
import com.sitedefteri.repository.PaymentRepository;
import com.sitedefteri.repository.DueRepository;
import com.sitedefteri.repository.IncomeRepository;
import com.sitedefteri.repository.UserRepository;
import com.sitedefteri.repository.ApartmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {
    
    private final PaymentRepository paymentRepository;
    private final DueRepository dueRepository;
    private final IncomeRepository incomeRepository;
    private final UserRepository userRepository;
    private final ApartmentRepository apartmentRepository;
    
    @Transactional
    public PaymentResponse processPayment(CreatePaymentRequest request, String userId) {
        log.info("Processing payment for due: {}, user: {}, method: {}", 
                request.getDueId(), userId, request.getPaymentMethod());
        
        // Due kontrolü
        Due due = dueRepository.findById(request.getDueId())
                .orElseThrow(() -> new ResourceNotFoundException("Aidat", "id", request.getDueId()));
        
        // Aidat zaten ödenmişse hata ver
        if (due.getStatus() == Due.DueStatus.odendi) {
            throw new BadRequestException("Bu aidat zaten ödenmiş");
        }
        
        Payment payment = new Payment();
        payment.setDueId(request.getDueId());
        payment.setUserId(userId);
        payment.setSiteId("1"); // TODO: Get from user's site
        payment.setAmount(request.getAmount());
        
        // Komisyon hesaplama - eğer frontend'den gelmemişse otomatik hesapla
        BigDecimal systemCommission = request.getSystemCommissionAmount();
        if (systemCommission == null || systemCommission.compareTo(BigDecimal.ZERO) == 0) {
            // %2 komisyon hesapla
            systemCommission = request.getAmount().multiply(new BigDecimal("0.02"));
        }
        payment.setSystemCommissionAmount(systemCommission);
        
        payment.setCurrencyCode(request.getCurrencyCode() != null ? request.getCurrencyCode() : "TRY");
        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setIdempotencyKey(UUID.randomUUID().toString());
        payment.setReceiptUrl(request.getReceiptUrl());
        payment.setNotes(request.getNotes());
        
        // Ödeme yöntemine göre durum belirleme
        // DEMO ORTAMI: Tüm ödeme yöntemleri direkt onaylı
        if ("card".equals(request.getPaymentMethod()) || "virtual".equals(request.getPaymentMethod()) ||
            "transfer".equals(request.getPaymentMethod()) || "cash".equals(request.getPaymentMethod())) {
            // Demo ortamında tüm ödemeler direkt onaylı
            payment.setStatus("tamamlandi");
            payment.setPaymentDate(LocalDateTime.now());
            payment.setReceiptNumber(generateReceiptNumber());
            
            // Aidat durumunu güncelle
            due.setStatus(Due.DueStatus.odendi);
            dueRepository.save(due);
            
            // Gelir kaydı oluştur
            createIncomeRecord(payment, due);
            
        } else {
            throw new BadRequestException("Geçersiz ödeme yöntemi: " + request.getPaymentMethod());
        }
        
        Payment saved = paymentRepository.save(payment);
        log.info("Payment processed with ID: {}, status: {}", saved.getId(), saved.getStatus());
        
        return toResponse(saved);
    }
    
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentById(String paymentId, String userId) {
        log.info("Fetching payment: {} for user: {}", paymentId, userId);
        
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Ödeme", "id", paymentId));
        
        // Kullanıcı sadece kendi ödemelerini görebilir
        if (!payment.getUserId().equals(userId)) {
            throw new BadRequestException("Bu ödemeyi görüntüleme yetkiniz yok");
        }
        
        return toResponse(payment);
    }
    
    @Transactional
    public PaymentResponse cancelPayment(String paymentId, String userId) {
        log.info("Cancelling payment: {} by user: {}", paymentId, userId);
        
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Ödeme", "id", paymentId));
        
        // Kullanıcı sadece kendi ödemelerini iptal edebilir
        if (!payment.getUserId().equals(userId)) {
            throw new BadRequestException("Bu ödemeyi iptal etme yetkiniz yok");
        }
        
        // Sadece bekleyen ödemeler iptal edilebilir
        if (!"bekliyor".equals(payment.getStatus())) {
            throw new BadRequestException("Sadece bekleyen ödemeler iptal edilebilir");
        }
        
        payment.setStatus("iptal_edildi");
        
        Payment updated = paymentRepository.save(payment);
        log.info("Payment cancelled: {}", paymentId);
        
        return toResponse(updated);
    }
    
    @Transactional
    public PaymentResponse createPayment(CreatePaymentRequest request, String userId) {
        log.info("Creating payment for due: {}, user: {}", request.getDueId(), userId);
        
        // Due kontrolü
        Due due = dueRepository.findById(request.getDueId())
                .orElseThrow(() -> new ResourceNotFoundException("Aidat", "id", request.getDueId()));
        
        // Aidat zaten ödenmişse hata ver
        if (due.getStatus() == Due.DueStatus.odendi) {
            throw new BadRequestException("Bu aidat zaten ödenmiş");
        }
        
        Payment payment = new Payment();
        payment.setDueId(request.getDueId());
        payment.setUserId(userId);
        payment.setSiteId("1"); // TODO: Get from user context
        payment.setAmount(request.getAmount());
        
        // Komisyon hesaplama - eğer frontend'den gelmemişse otomatik hesapla
        BigDecimal systemCommission = request.getSystemCommissionAmount();
        if (systemCommission == null || systemCommission.compareTo(BigDecimal.ZERO) == 0) {
            // %2 komisyon hesapla
            systemCommission = request.getAmount().multiply(new BigDecimal("0.02"));
        }
        payment.setSystemCommissionAmount(systemCommission);
        
        payment.setCurrencyCode("TRY");
        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setStatus("bekliyor"); // Yönetici onayı bekliyor
        payment.setIdempotencyKey(UUID.randomUUID().toString());
        payment.setReceiptUrl(request.getReceiptUrl());
        payment.setNotes(request.getNotes());
        
        Payment saved = paymentRepository.save(payment);
        log.info("Payment created with ID: {}", saved.getId());
        
        return toResponse(saved);
    }
    
    @Transactional
    public PaymentResponse approvePayment(String paymentId, String adminId) {
        log.info("Approving payment: {} by admin: {}", paymentId, adminId);
        
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Ödeme", "id", paymentId));
        
        if (!"bekliyor".equals(payment.getStatus())) {
            throw new BadRequestException("Sadece bekleyen ödemeler onaylanabilir");
        }
        
        payment.setStatus("tamamlandi");
        payment.setPaymentDate(LocalDateTime.now());
        payment.setReceiptNumber(generateReceiptNumber());
        
        // Aidat durumunu güncelle
        Due due = dueRepository.findById(payment.getDueId())
                .orElseThrow(() -> new ResourceNotFoundException("Aidat", "id", payment.getDueId()));
        due.setStatus(Due.DueStatus.odendi);
        dueRepository.save(due);
        
        // Otomatik gelir kaydı oluştur
        createIncomeRecord(payment, due);
        
        Payment updated = paymentRepository.save(payment);
        log.info("Payment approved: {}", paymentId);
        
        return toResponse(updated);
    }
    
    /**
     * Aidat ödemesi onaylandığında otomatik gelir kaydı oluşturur
     */
    private void createIncomeRecord(Payment payment, Due due) {
        try {
            Income income = new Income();
            income.setSiteId(payment.getSiteId());
            income.setFinancialPeriodId(due.getFinancialPeriodId());
            income.setCategory("Aidat Geliri");
            income.setDescription(String.format("Aidat Ödemesi - Daire: %s", due.getApartmentId()));
            income.setAmount(payment.getAmount());
            income.setCurrencyCode(payment.getCurrencyCode());
            income.setIncomeDate(LocalDate.now());
            income.setPaymentMethod(payment.getPaymentMethod());
            income.setReceiptNumber(payment.getReceiptNumber());
            income.setReceiptUrl(payment.getReceiptUrl());
            income.setNotes(String.format("Ödeme ID: %s, Aidat ID: %s", payment.getId(), due.getId()));
            
            incomeRepository.save(income);
            log.info("Income record created for payment: {}, amount: {}", payment.getId(), payment.getAmount());
        } catch (Exception e) {
            log.error("Failed to create income record for payment: {}", payment.getId(), e);
            // Gelir kaydı oluşturulamazsa ödeme işlemini geri almıyoruz, sadece log'luyoruz
        }
    }
    
    @Transactional
    public PaymentResponse rejectPayment(String paymentId, String adminId, String reason) {
        log.info("Rejecting payment: {} by admin: {}", paymentId, adminId);
        
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Ödeme", "id", paymentId));
        
        if (!"bekliyor".equals(payment.getStatus())) {
            throw new BadRequestException("Sadece bekleyen ödemeler reddedilebilir");
        }
        
        payment.setStatus("basarisiz");
        payment.setFailureReason(reason);
        
        Payment updated = paymentRepository.save(payment);
        log.info("Payment rejected: {}", paymentId);
        
        return toResponse(updated);
    }
    
    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsByUser(String userId) {
        log.info("Fetching payments for user: {}", userId);
        return paymentRepository.findByUserId(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<PaymentResponse> getPendingPayments(String siteId) {
        log.info("Fetching pending payments for site: {}", siteId);
        return paymentRepository.findBySiteIdAndStatus(siteId, "bekliyor")
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    private String generateReceiptNumber() {
        return "FIS-" + System.currentTimeMillis();
    }
    
    private PaymentResponse toResponse(Payment payment) {
        PaymentResponse response = new PaymentResponse();
        response.setId(payment.getId());
        response.setDueId(payment.getDueId());
        response.setUserId(payment.getUserId());
        response.setAmount(payment.getAmount());
        response.setCurrencyCode(payment.getCurrencyCode());
        response.setPaymentMethod(payment.getPaymentMethod());
        response.setStatus(payment.getStatus());
        response.setReceiptUrl(payment.getReceiptUrl());
        response.setReceiptNumber(payment.getReceiptNumber());
        response.setPaymentDate(payment.getPaymentDate());
        response.setCreatedAt(payment.getCreatedAt());
        response.setNotes(payment.getNotes());
        
        // Kullanıcı bilgilerini ekle
        try {
            userRepository.findById(payment.getUserId()).ifPresent(user -> {
                response.setUserName(user.getFullName());
                
                // Due üzerinden apartmentId'yi al
                dueRepository.findById(payment.getDueId()).ifPresent(due -> {
                    if (due.getApartmentId() != null) {
                        apartmentRepository.findById(due.getApartmentId()).ifPresent(apartment -> {
                            String apartmentNumber = apartment.getBlockName() + "-" + apartment.getUnitNumber();
                            response.setApartmentNumber(apartmentNumber);
                        });
                    }
                });
            });
        } catch (Exception e) {
            log.warn("Could not fetch user/apartment info for payment: {}", payment.getId(), e);
        }
        
        return response;
    }
    
    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsBySite(String siteId) {
        return paymentRepository.findAll().stream()
                .filter(p -> siteId.equals(p.getSiteId()))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
}
