package com.sitedefteri.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CurrencyRateResponse {
    private String currency;
    private String symbol;
    private Double rate;
    private LocalDateTime lastUpdate;
}
