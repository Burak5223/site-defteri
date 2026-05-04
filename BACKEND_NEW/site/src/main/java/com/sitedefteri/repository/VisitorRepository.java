package com.sitedefteri.repository;

import com.sitedefteri.entity.Visitor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface VisitorRepository extends JpaRepository<Visitor, String> {
    List<Visitor> findByApartmentIdOrderByExpectedAtDesc(String apartmentId);
    
    List<Visitor> findBySiteIdOrderByExpectedAtDesc(String siteId);
    
    /**
     * Aktif olan ve süresi dolmuş ziyaretçileri bul
     */
    @Query("SELECT v FROM Visitor v WHERE v.isActive = true AND v.stayEndDate < :now")
    List<Visitor> findActiveExpiredVisitors(@Param("now") LocalDateTime now);
    
    /**
     * Site bazında aktif ziyaretçileri bul
     */
    @Query("SELECT v FROM Visitor v WHERE v.siteId = :siteId AND v.isActive = true ORDER BY v.stayEndDate DESC")
    List<Visitor> findActiveBySiteId(@Param("siteId") String siteId);
}
