package com.sitedefteri.controller;

import com.sitedefteri.dto.request.CreateExpenseRequest;
import com.sitedefteri.dto.response.ExpenseResponse;
import com.sitedefteri.entity.Expense;
import com.sitedefteri.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ExpenseController {
    
    private final ExpenseService expenseService;
    
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'RESIDENT')")
    @GetMapping("/sites/{siteId}/expenses")
    public ResponseEntity<List<ExpenseResponse>> getAllExpenses(@PathVariable String siteId) {
        log.info("Getting expenses for site: {}", siteId);
        List<Expense> expenses = expenseService.getAllExpensesBySite(siteId);
        List<ExpenseResponse> responses = expenses.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }
    
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @GetMapping("/expenses")
    public ResponseEntity<List<ExpenseResponse>> getAllExpensesSimple() {
        log.info("Getting all expenses");
        List<Expense> expenses = expenseService.getAllExpensesBySite("1");
        List<ExpenseResponse> responses = expenses.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }
    
    @PostMapping("/sites/{siteId}/expenses")
    public ResponseEntity<ExpenseResponse> createExpenseForSite(
            @PathVariable String siteId,
            @Valid @RequestBody CreateExpenseRequest request) {
        log.info("Creating expense for site: {}, category: {}", siteId, request.getCategory());
        
        Expense expense = new Expense();
        expense.setSiteId(siteId);
        expense.setCategory(request.getCategory());
        expense.setDescription(request.getDescription());
        expense.setAmount(request.getAmount());
        expense.setCurrencyCode(request.getCurrencyCode() != null ? request.getCurrencyCode() : "TRY");
        expense.setExpenseDate(request.getExpenseDate());
        expense.setVendorName(request.getVendorName());
        expense.setInvoiceNumber(request.getInvoiceNumber());
        expense.setInvoiceUrl(request.getInvoiceUrl());
        expense.setPaymentMethod(request.getPaymentMethod());
        expense.setNotes(request.getNotes());
        
        // Mark as paid immediately
        expense.setPaidAt(LocalDateTime.now());
        
        Expense created = expenseService.createExpense(expense);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(created));
    }
    
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @GetMapping("/expenses/site/{siteId}")
    public ResponseEntity<List<ExpenseResponse>> getExpensesBySite(@PathVariable String siteId) {
        log.info("Getting expenses for site: {}", siteId);
        List<Expense> expenses = expenseService.getAllExpensesBySite(siteId);
        List<ExpenseResponse> responses = expenses.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }
    
    @GetMapping("/expenses/{id}")
    public ResponseEntity<ExpenseResponse> getExpenseById(@PathVariable String id) {
        log.info("Getting expense: {}", id);
        Expense expense = expenseService.getExpenseById(id);
        return ResponseEntity.ok(toResponse(expense));
    }
    
    @PostMapping("/expenses")
    public ResponseEntity<ExpenseResponse> createExpense(@Valid @RequestBody CreateExpenseRequest request) {
        log.info("Creating expense for site: {}, category: {}", request.getSiteId(), request.getCategory());
        
        Expense expense = new Expense();
        expense.setSiteId(request.getSiteId());
        expense.setCategory(request.getCategory());
        expense.setDescription(request.getDescription());
        expense.setAmount(request.getAmount());
        expense.setCurrencyCode(request.getCurrencyCode());
        expense.setExpenseDate(request.getExpenseDate());
        expense.setVendorName(request.getVendorName());
        expense.setInvoiceNumber(request.getInvoiceNumber());
        expense.setInvoiceUrl(request.getInvoiceUrl());
        expense.setPaymentMethod(request.getPaymentMethod());
        expense.setNotes(request.getNotes());
        
        // Mark as paid immediately
        expense.setPaidAt(LocalDateTime.now());
        
        Expense created = expenseService.createExpense(expense);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(created));
    }
    
    @PutMapping("/expenses/{id}")
    public ResponseEntity<ExpenseResponse> updateExpense(
            @PathVariable String id,
            @Valid @RequestBody CreateExpenseRequest request) {
        log.info("Updating expense: {}", id);
        
        Expense expense = new Expense();
        expense.setCategory(request.getCategory());
        expense.setDescription(request.getDescription());
        expense.setAmount(request.getAmount());
        expense.setCurrencyCode(request.getCurrencyCode());
        expense.setExpenseDate(request.getExpenseDate());
        expense.setVendorName(request.getVendorName());
        expense.setInvoiceNumber(request.getInvoiceNumber());
        expense.setInvoiceUrl(request.getInvoiceUrl());
        expense.setPaymentMethod(request.getPaymentMethod());
        expense.setNotes(request.getNotes());
        
        Expense updated = expenseService.updateExpense(id, expense);
        return ResponseEntity.ok(toResponse(updated));
    }
    
    @DeleteMapping("/expenses/{id}")
    public ResponseEntity<Void> deleteExpense(@PathVariable String id) {
        log.info("Deleting expense: {}", id);
        expenseService.deleteExpense(id);
        return ResponseEntity.noContent().build();
    }
    
    @PutMapping("/expenses/{id}/approve")
    public ResponseEntity<ExpenseResponse> approveExpense(
            @PathVariable String id,
            @RequestHeader("X-User-Id") String approvedBy) {
        log.info("Approving expense: {} by {}", id, approvedBy);
        Expense approved = expenseService.approveExpense(id, approvedBy);
        return ResponseEntity.ok(toResponse(approved));
    }
    
    @GetMapping("/expenses/site/{siteId}/category/{category}")
    public ResponseEntity<List<ExpenseResponse>> getExpensesByCategory(
            @PathVariable String siteId,
            @PathVariable String category) {
        log.info("Getting expenses for site: {}, category: {}", siteId, category);
        List<Expense> expenses = expenseService.getExpensesByCategory(siteId, category);
        List<ExpenseResponse> responses = expenses.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }
    
    private ExpenseResponse toResponse(Expense expense) {
        ExpenseResponse response = new ExpenseResponse();
        response.setId(expense.getId());
        response.setSiteId(expense.getSiteId());
        response.setFinancialPeriodId(expense.getFinancialPeriodId());
        response.setCategory(expense.getCategory());
        response.setDescription(expense.getDescription());
        response.setAmount(expense.getAmount());
        response.setCurrencyCode(expense.getCurrencyCode());
        response.setExpenseDate(expense.getExpenseDate());
        response.setVendorName(expense.getVendorName());
        response.setInvoiceNumber(expense.getInvoiceNumber());
        response.setInvoiceUrl(expense.getInvoiceUrl());
        response.setPaymentMethod(expense.getPaymentMethod());
        response.setPaidAt(expense.getPaidAt());
        response.setNotes(expense.getNotes());
        response.setCreatedAt(expense.getCreatedAt());
        response.setUpdatedAt(expense.getUpdatedAt());
        return response;
    }
}
