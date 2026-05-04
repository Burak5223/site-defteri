package com.sitedefteri.service;

import com.sitedefteri.entity.Due;
import com.sitedefteri.entity.Expense;
import com.sitedefteri.entity.Payment;
import com.sitedefteri.repository.DueRepository;
import com.sitedefteri.repository.ExpenseRepository;
import com.sitedefteri.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {
    
    private final DueRepository dueRepository;
    private final ExpenseRepository expenseRepository;
    private final PaymentRepository paymentRepository;
    
    @Transactional(readOnly = true)
    public Map<String, Object> generateFinancialReport(String siteId, LocalDate from, LocalDate to) {
        log.info("Generating financial report for site: {} from {} to {}", siteId, from, to);
        
        Map<String, Object> report = new HashMap<>();
        
        // Period info
        report.put("siteId", siteId);
        report.put("periodStart", from);
        report.put("periodEnd", to);
        report.put("generatedAt", LocalDateTime.now());
        
        // Income (Payments)
        List<Payment> payments = paymentRepository.findBySiteIdAndCreatedAtBetween(
                siteId, from.atStartOfDay(), to.atTime(23, 59, 59));
        
        BigDecimal totalIncome = payments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        report.put("totalIncome", totalIncome);
        report.put("paymentCount", payments.size());
        
        // Expenses
        List<Expense> expenses = expenseRepository.findBySiteIdAndExpenseDateBetween(siteId, from, to);
        
        BigDecimal totalExpenses = expenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        report.put("totalExpenses", totalExpenses);
        report.put("expenseCount", expenses.size());
        
        // Expenses by category
        Map<String, BigDecimal> expensesByCategory = expenses.stream()
                .collect(Collectors.groupingBy(
                        Expense::getCategory,
                        Collectors.reducing(BigDecimal.ZERO, Expense::getAmount, BigDecimal::add)
                ));
        report.put("expensesByCategory", expensesByCategory);
        
        // Net balance
        BigDecimal netBalance = totalIncome.subtract(totalExpenses);
        report.put("netBalance", netBalance);
        
        // Dues summary
        List<Due> dues = dueRepository.findBySiteId(siteId);
        long paidDues = dues.stream().filter(d -> "paid".equals(d.getStatus())).count();
        long unpaidDues = dues.stream().filter(d -> "unpaid".equals(d.getStatus())).count();
        
        report.put("totalDues", dues.size());
        report.put("paidDues", paidDues);
        report.put("unpaidDues", unpaidDues);
        
        return report;
    }
    
    public byte[] generateFinancialReportPdf(String siteId, LocalDate from, LocalDate to) {
        // TODO: Implement PDF generation using iText or similar library
        log.warn("PDF generation not yet implemented");
        return "PDF generation not yet implemented".getBytes();
    }
    
    public byte[] generateFinancialReportXlsx(String siteId, LocalDate from, LocalDate to) {
        // TODO: Implement XLSX generation using Apache POI
        log.warn("XLSX generation not yet implemented");
        return "XLSX generation not yet implemented".getBytes();
    }
    
    @Transactional(readOnly = true)
    public Map<String, Object> generatePaymentsReport(String siteId, LocalDate from, LocalDate to) {
        log.info("Generating payments report for site: {} from {} to {}", siteId, from, to);
        
        Map<String, Object> report = new HashMap<>();
        
        // Period info
        report.put("siteId", siteId);
        report.put("periodStart", from);
        report.put("periodEnd", to);
        report.put("generatedAt", LocalDateTime.now());
        
        // Get payments
        List<Payment> payments = paymentRepository.findBySiteIdAndCreatedAtBetween(
                siteId, from.atStartOfDay(), to.atTime(23, 59, 59));
        
        // Total amount
        BigDecimal totalAmount = payments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        report.put("totalAmount", totalAmount);
        report.put("paymentCount", payments.size());
        
        // Payments by status
        Map<String, Long> paymentsByStatus = payments.stream()
                .collect(Collectors.groupingBy(Payment::getStatus, Collectors.counting()));
        report.put("paymentsByStatus", paymentsByStatus);
        
        // Payments by method
        Map<String, Long> paymentsByMethod = payments.stream()
                .collect(Collectors.groupingBy(Payment::getPaymentMethod, Collectors.counting()));
        report.put("paymentsByMethod", paymentsByMethod);
        
        // Payment details
        List<Map<String, Object>> paymentDetails = payments.stream()
                .map(p -> {
                    Map<String, Object> detail = new HashMap<>();
                    detail.put("id", p.getId());
                    detail.put("dueId", p.getDueId());
                    detail.put("amount", p.getAmount());
                    detail.put("status", p.getStatus());
                    detail.put("paymentMethod", p.getPaymentMethod());
                    detail.put("createdAt", p.getCreatedAt());
                    return detail;
                })
                .collect(Collectors.toList());
        
        report.put("payments", paymentDetails);
        
        return report;
    }
    
    public String generatePaymentsReportCsv(String siteId, LocalDate from, LocalDate to) {
        List<Payment> payments = paymentRepository.findBySiteIdAndCreatedAtBetween(
                siteId, from.atStartOfDay(), to.atTime(23, 59, 59));
        
        StringBuilder csv = new StringBuilder();
        csv.append("ID,Due ID,Amount,Currency,Status,Payment Method,Created At\n");
        
        for (Payment payment : payments) {
            csv.append(payment.getId()).append(",")
               .append(payment.getDueId()).append(",")
               .append(payment.getAmount()).append(",")
               .append(payment.getCurrencyCode()).append(",")
               .append(payment.getStatus()).append(",")
               .append(payment.getPaymentMethod()).append(",")
               .append(payment.getCreatedAt()).append("\n");
        }
        
        return csv.toString();
    }
    
    @Transactional(readOnly = true)
    public Map<String, Object> generateAuditReport(LocalDate from, LocalDate to) {
        log.info("Generating audit report from {} to {}", from, to);
        
        Map<String, Object> report = new HashMap<>();
        
        // Period info
        report.put("periodStart", from);
        report.put("periodEnd", to);
        report.put("generatedAt", LocalDateTime.now());
        
        // TODO: Implement audit log tracking
        // For now, return basic statistics
        
        report.put("message", "Audit logging not yet fully implemented");
        report.put("totalEvents", 0);
        report.put("eventsByType", new HashMap<>());
        
        return report;
    }
}
