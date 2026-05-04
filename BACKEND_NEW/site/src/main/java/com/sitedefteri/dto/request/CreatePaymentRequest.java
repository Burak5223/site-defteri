package com.sitedefteri.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class CreatePaymentRequest {
    @NotBlank(message = "Aidat ID gereklidir")
    private String dueId;
    
    // Çoklu aidat ödemesi için (opsiyonel)
    private List<String> dueIds;
    
    @NotNull(message = "Tutar gereklidir")
    @DecimalMin(value = "0.01", message = "Tutar 0'dan büyük olmalıdır")
    private BigDecimal amount;
    
    // Sistem komisyon tutarı (%2)
    private BigDecimal systemCommissionAmount;
    
    // Para birimi (TRY, USD, EUR)
    private String currencyCode = "TRY";
    
    // Taksit sayısı
    private Integer installment = 1;
    
    @NotBlank(message = "Ödeme yöntemi gereklidir")
    private String paymentMethod; // card, virtual, transfer, cash
    
    // Kart bilgileri (card için)
    private CardInfo cardInfo;
    
    // Dekont/Fatura URL (transfer/cash için)
    private String receiptUrl;
    
    // Kullanıcı notu
    private String notes;
    
    @Data
    public static class CardInfo {
        private String cardName;
        private String cardNumber;
        private String cardExpiry;
        private String cardCvv;
    }
}
