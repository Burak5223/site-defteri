package com.sitedefteri.repository;

import com.sitedefteri.entity.Due;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DueRepository extends JpaRepository<Due, String> {
    List<Due> findByApartmentIdOrderByDueDateDesc(String apartmentId);
    
    // Apartment ID listesine göre aidatları getir
    List<Due> findByApartmentIdInOrderByDueDateDesc(List<String> apartmentIds);
    
    // Override findAll to exclude deleted records
    @Query("SELECT d FROM Due d WHERE d.isDeleted = false ORDER BY d.dueDate DESC")
    List<Due> findAll();
    
    @Query("SELECT d FROM Due d WHERE d.apartmentId IN (SELECT a.id FROM Apartment a WHERE a.siteId = :siteId)")
    List<Due> findBySiteId(String siteId);
    
    // Find dues for a specific user (by their apartments)
    @Query("SELECT d FROM Due d WHERE d.isDeleted = false AND d.apartmentId IN " +
           "(SELECT a.id FROM Apartment a WHERE a.currentResidentId = :userId OR a.ownerUserId = :userId) " +
           "ORDER BY d.dueDate DESC")
    List<Due> findByUserId(String userId);
    
    // Performance calculation methods
    long countByStatusIn(List<String> statuses);
    long countByStatus(String status);
    
    // Site-specific performance methods
    @Query("SELECT COUNT(d) FROM Due d WHERE d.apartmentId IN (SELECT a.id FROM Apartment a WHERE a.siteId = :siteId)")
    long countBySiteId(@Param("siteId") String siteId);
    
    @Query("SELECT COUNT(d) FROM Due d WHERE d.status = :status AND d.apartmentId IN (SELECT a.id FROM Apartment a WHERE a.siteId = :siteId)")
    long countBySiteIdAndStatus(@Param("siteId") String siteId, @Param("status") String status);
}
