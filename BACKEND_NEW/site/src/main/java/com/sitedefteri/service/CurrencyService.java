package com.sitedefteri.service;

import com.sitedefteri.dto.response.CurrencyRateResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class CurrencyService {

    private final RestTemplate restTemplate;
    private Map<String, CurrencyRateResponse> cachedRates = new HashMap<>();
    private LocalDateTime lastFetchTime;

    public List<CurrencyRateResponse> getCurrentRates() {
        // Cache için 5 saniye kontrolü
        if (lastFetchTime != null && 
            LocalDateTime.now().minusSeconds(5).isBefore(lastFetchTime)) {
            log.info("Returning cached rates ({})", cachedRates.size());
            return new ArrayList<>(cachedRates.values());
        }

        try {
            // exchangerate-api.com - Güncel ve güvenilir kurlar (ücretsiz, günlük güncellenir)
            String url = "https://api.exchangerate-api.com/v4/latest/TRY";
            
            log.info("Fetching currency rates from: {}", url);
            String jsonResponse = restTemplate.getForObject(url, String.class);
            
            if (jsonResponse != null && jsonResponse.contains("rates")) {
                log.info("Currency API Response received");
                
                // TRY (baz para birimi)
                CurrencyRateResponse tryRate = new CurrencyRateResponse();
                tryRate.setCurrency("TRY");
                tryRate.setSymbol("₺");
                tryRate.setRate(1.0);
                tryRate.setLastUpdate(LocalDateTime.now());
                cachedRates.put("TRY", tryRate);
                
                // USD kuru - TRY bazlı olduğu için 1/rate yapıyoruz
                Double usdRateInverse = extractRate(jsonResponse, "USD");
                if (usdRateInverse != null && usdRateInverse > 0) {
                    Double usdRate = 1.0 / usdRateInverse; // TRY/USD'yi USD/TRY'ye çevir
                    CurrencyRateResponse usdRateResponse = new CurrencyRateResponse();
                    usdRateResponse.setCurrency("USD");
                    usdRateResponse.setSymbol("$");
                    usdRateResponse.setRate(Math.round(usdRate * 100.0) / 100.0); // 2 ondalık
                    usdRateResponse.setLastUpdate(LocalDateTime.now());
                    cachedRates.put("USD", usdRateResponse);
                    log.info("USD rate updated: {} TRY", usdRateResponse.getRate());
                }
                
                // EUR kuru - TRY bazlı olduğu için 1/rate yapıyoruz
                Double eurRateInverse = extractRate(jsonResponse, "EUR");
                if (eurRateInverse != null && eurRateInverse > 0) {
                    Double eurRate = 1.0 / eurRateInverse; // TRY/EUR'yi EUR/TRY'ye çevir
                    CurrencyRateResponse eurRateResponse = new CurrencyRateResponse();
                    eurRateResponse.setCurrency("EUR");
                    eurRateResponse.setSymbol("€");
                    eurRateResponse.setRate(Math.round(eurRate * 100.0) / 100.0); // 2 ondalık
                    eurRateResponse.setLastUpdate(LocalDateTime.now());
                    cachedRates.put("EUR", eurRateResponse);
                    log.info("EUR rate updated: {} TRY", eurRateResponse.getRate());
                }
                
                lastFetchTime = LocalDateTime.now();
            }
        } catch (Exception e) {
            log.error("Error fetching currency rates: {}", e.getMessage(), e);
            
            // Hata durumunda varsayılan değerler (güncel kurlar - Nisan 2026)
            if (cachedRates.isEmpty()) {
                cachedRates.put("TRY", new CurrencyRateResponse("TRY", "₺", 1.0, LocalDateTime.now()));
                cachedRates.put("USD", new CurrencyRateResponse("USD", "$", 34.50, LocalDateTime.now()));
                cachedRates.put("EUR", new CurrencyRateResponse("EUR", "€", 37.50, LocalDateTime.now()));
                log.info("Using fallback currency rates");
            }
        }
        
        // Her zaman liste döndür (boş olsa bile) - TRY, USD, EUR sırasıyla
        List<CurrencyRateResponse> result = new ArrayList<>();
        
        // TRY her zaman ilk sırada
        if (cachedRates.containsKey("TRY")) {
            result.add(cachedRates.get("TRY"));
        }
        // USD ikinci sırada
        if (cachedRates.containsKey("USD")) {
            result.add(cachedRates.get("USD"));
        }
        // EUR üçüncü sırada
        if (cachedRates.containsKey("EUR")) {
            result.add(cachedRates.get("EUR"));
        }
        
        log.info("Returning {} currency rates in order: TRY, USD, EUR", result.size());
        return result;
    }
    
    private Double extractRate(String json, String currency) {
        try {
            // JSON'dan manuel parse: "USD":0.029
            String pattern = "\"" + currency + "\":";
            int start = json.indexOf(pattern);
            if (start == -1) return null;
            
            start += pattern.length();
            int end = json.indexOf(",", start);
            if (end == -1) {
                end = json.indexOf("}", start);
            }
            if (end == -1) return null;
            
            String rateStr = json.substring(start, end).trim();
            return Double.parseDouble(rateStr);
        } catch (Exception e) {
            log.error("Error parsing rate for {}: {}", currency, e.getMessage());
            return null;
        }
    }
}
