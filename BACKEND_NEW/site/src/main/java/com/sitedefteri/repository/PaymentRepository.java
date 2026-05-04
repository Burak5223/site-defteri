package com.sitedefteri.repository;

import com.sitedefteri.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, String> {
    List<Payment> findByDueIdOrderByPaymentDateDesc(String dueId);
    List<Payment> findByUserIdOrderByPaymentDateDesc(String userId);
    List<Payment> findByUserId(String userId);
    List<Payment> findByStatus(String status);
    List<Payment> findBySiteIdAndStatus(String siteId, String status);
    List<Payment> findBySiteIdAndCreatedAtBetween(String siteId, LocalDateTime from, LocalDateTime to);
    
    // Commission calculation methods
    @Query("SELECT SUM(p.systemCommissionAmount) FROM Payment p WHERE p.status = :status")
    BigDecimal findCommissionSumByStatus(@Param("status") String status);
    
    @Query("SELECT SUM(p.systemCommissionAmount) FROM Payment p WHERE p.status = :status AND p.paymentDate BETWEEN :startDate AND :endDate")
    BigDecimal findCommissionSumByStatusAndDateRange(@Param("status") String status, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT SUM(p.systemCommissionAmount) FROM Payment p WHERE p.siteId = :siteId AND p.status = :status")
    BigDecimal findCommissionSumBySiteIdAndStatus(@Param("siteId") String siteId, @Param("status") String status);
    
    // Count methods for performance calculations
    long countByStatus(String status);
    long countBySiteIdAndStatus(String siteId, String status);
}
