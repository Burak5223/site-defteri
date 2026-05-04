package com.sitedefteri.controller;

import com.sitedefteri.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ReportController {
    
    private final ReportService reportService;
    
    /**
     * Get all reports (simple endpoint for Super Admin)
     * GET /api/reports
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @GetMapping("/reports")
    public ResponseEntity<Map<String, Object>> getAllReports() {
        log.info("Getting all reports");
        // Return empty list for now
        return ResponseEntity.ok(Map.of("reports", List.of()));
    }
    
    /**
     * Finansal rapor
     * GET /api/reports/financial?siteId=&from=&to=&format=json|pdf|xlsx
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @GetMapping("/financial")
    public ResponseEntity<?> getFinancialReport(
            @RequestParam String siteId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "json") String format) {
        
        log.info("Generating financial report for site: {} from {} to {} in format: {}", 
                siteId, from, to, format);
        
        if ("json".equalsIgnoreCase(format)) {
            Map<String, Object> report = reportService.generateFinancialReport(siteId, from, to);
            return ResponseEntity.ok(report);
        } else if ("pdf".equalsIgnoreCase(format)) {
            byte[] pdfData = reportService.generateFinancialReportPdf(siteId, from, to);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=financial-report.pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfData);
        } else if ("xlsx".equalsIgnoreCase(format)) {
            byte[] xlsxData = reportService.generateFinancialReportXlsx(siteId, from, to);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=financial-report.xlsx")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(xlsxData);
        } else {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid format. Use json, pdf, or xlsx"));
        }
    }
    
    /**
     * Ödeme raporu
     * GET /api/reports/payments?siteId=&from=&to=&format=json|csv
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @GetMapping("/payments")
    public ResponseEntity<?> getPaymentsReport(
            @RequestParam String siteId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "json") String format) {
        
        log.info("Generating payments report for site: {} from {} to {} in format: {}", 
                siteId, from, to, format);
        
        if ("json".equalsIgnoreCase(format)) {
            Map<String, Object> report = reportService.generatePaymentsReport(siteId, from, to);
            return ResponseEntity.ok(report);
        } else if ("csv".equalsIgnoreCase(format)) {
            String csvData = reportService.generatePaymentsReportCsv(siteId, from, to);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=payments-report.csv")
                    .contentType(MediaType.parseMediaType("text/csv"))
                    .body(csvData);
        } else {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid format. Use json or csv"));
        }
    }
    
    /**
     * Denetim raporu
     * GET /api/reports/audit?from=&to=
     */
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @GetMapping("/audit")
    public ResponseEntity<Map<String, Object>> getAuditReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        
        log.info("Generating audit report from {} to {}", from, to);
        Map<String, Object> report = reportService.generateAuditReport(from, to);
        return ResponseEntity.ok(report);
    }
}
