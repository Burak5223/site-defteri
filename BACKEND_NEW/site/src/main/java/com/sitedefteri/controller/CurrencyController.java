package com.sitedefteri.controller;

import com.sitedefteri.dto.response.CurrencyRateResponse;
import com.sitedefteri.service.CurrencyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/currency")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CurrencyController {

    private final CurrencyService currencyService;

    @GetMapping("/rates")
    public ResponseEntity<List<CurrencyRateResponse>> getCurrentRates() {
        return ResponseEntity.ok(currencyService.getCurrentRates());
    }
}
