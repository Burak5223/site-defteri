package com.sitedefteri.repository;

import com.sitedefteri.entity.Package;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PackageRepository extends JpaRepository<Package, String> {
    List<Package> findByApartmentIdOrderByRecordedAtDesc(String apartmentId);
    List<Package> findByBlockIdOrderByRecordedAtDesc(String blockId);
    List<Package> findBySiteIdOrderByRecordedAtDesc(String siteId);
    List<Package> findByStatusOrderByRecordedAtDesc(String status);
    List<Package> findBySiteIdAndStatusOrderByRecordedAtDesc(String siteId, String status);
    List<Package> findByApartmentIdAndStatus(String apartmentId, String status);
    
    @Query(value = "SELECT rh.apartment_id FROM residency_history rh " +
           "WHERE rh.user_id = :userId " +
           "AND rh.status = 'active' " +
           "AND rh.move_out_date IS NULL " +
           "LIMIT 1", 
           nativeQuery = true)
    List<String> findUserActiveApartment(@Param("userId") String userId);
    
    @Query(value = "SELECT a.id FROM apartments a " +
           "WHERE a.unit_number = :unitNumber " +
           "AND a.site_id = :siteId " +
           "LIMIT 1", 
           nativeQuery = true)
    List<String> findApartmentByUnitNumberAndSite(@Param("unitNumber") String unitNumber, @Param("siteId") String siteId);
    
    // Performance calculation methods
    long countByStatusIn(List<String> statuses);
    long countByStatus(String status);
    
    // Site-specific performance methods
    @Query("SELECT COUNT(p) FROM Package p WHERE p.apartmentId IN (SELECT a.id FROM Apartment a WHERE a.siteId = :siteId)")
    long countBySiteId(@Param("siteId") String siteId);
    
    @Query("SELECT COUNT(p) FROM Package p WHERE p.status = :status AND p.apartmentId IN (SELECT a.id FROM Apartment a WHERE a.siteId = :siteId)")
    long countBySiteIdAndStatus(@Param("siteId") String siteId, @Param("status") String status);
}
