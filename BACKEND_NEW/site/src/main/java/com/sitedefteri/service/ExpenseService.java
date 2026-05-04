package com.sitedefteri.service;

import com.sitedefteri.entity.Expense;
import com.sitedefteri.exception.ResourceNotFoundException;
import com.sitedefteri.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExpenseService {
    
    private final ExpenseRepository expenseRepository;
    
    @Transactional(readOnly = true)
    public List<Expense> getAllExpensesBySite(String siteId) {
        return expenseRepository.findBySiteIdOrderByExpenseDateDesc(siteId);
    }
    
    @Transactional(readOnly = true)
    public Expense getExpenseById(String id) {
        return expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id: " + id));
    }
    
    @Transactional
    public Expense createExpense(Expense expense) {
        log.info("Creating expense for site: {}, category: {}, amount: {}", 
                expense.getSiteId(), expense.getCategory(), expense.getAmount());
        
        return expenseRepository.save(expense);
    }
    
    @Transactional
    public Expense updateExpense(String id, Expense expenseDetails) {
        Expense expense = getExpenseById(id);
        
        expense.setCategory(expenseDetails.getCategory());
        expense.setDescription(expenseDetails.getDescription());
        expense.setAmount(expenseDetails.getAmount());
        expense.setExpenseDate(expenseDetails.getExpenseDate());
        expense.setVendorName(expenseDetails.getVendorName());
        expense.setInvoiceNumber(expenseDetails.getInvoiceNumber());
        expense.setInvoiceUrl(expenseDetails.getInvoiceUrl());
        expense.setPaymentMethod(expenseDetails.getPaymentMethod());
        expense.setPaidAt(expenseDetails.getPaidAt());
        expense.setNotes(expenseDetails.getNotes());
        
        log.info("Updated expense: {}", id);
        return expenseRepository.save(expense);
    }
    
    @Transactional
    public void deleteExpense(String id) {
        Expense expense = getExpenseById(id);
        
        log.info("Deleting expense: {}", id);
        expenseRepository.delete(expense);
    }
    
    @Transactional
    public Expense approveExpense(String id, String approvedBy) {
        Expense expense = getExpenseById(id);
        
        // TODO: Add approvedBy and approvedAt fields to Expense entity
        // For now, just add a note
        String currentNotes = expense.getNotes() != null ? expense.getNotes() : "";
        expense.setNotes(currentNotes + "\nOnaylandı: " + approvedBy + " - " + java.time.LocalDateTime.now());
        
        log.info("Expense approved: {} by {}", id, approvedBy);
        return expenseRepository.save(expense);
    }
    
    @Transactional(readOnly = true)
    public List<Expense> getExpensesByCategory(String siteId, String category) {
        return expenseRepository.findBySiteIdAndCategory(siteId, category);
    }
}
