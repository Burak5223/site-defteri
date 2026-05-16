package com.sitedefteri.repository;

import com.sitedefteri.entity.Apartment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApartmentRepository extends JpaRepository<Apartment, String> {
    @Query(value = "SELECT * FROM apartments WHERE block_id = :blockId AND is_deleted = 0 ORDER BY CAST(unit_number AS UNSIGNED)", nativeQuery = true)
    List<Apartment> findByBlockId(@Param("blockId") String blockId);
    
    List<Apartment> findByOwnerUserId(String ownerUserId);
    List<Apartment> findByCurrentResidentId(String currentResidentId);
    
    // Kullanıcının sakin veya sahibi olduğu apartmanları bul
    List<Apartment> findByCurrentResidentIdOrOwnerUserId(String currentResidentId, String ownerUserId);
    
    @Query(value = "SELECT a.* FROM apartments a " +
           "JOIN blocks b ON a.block_id = b.id " +
           "WHERE b.site_id = :siteId AND a.is_deleted = 0", 
           nativeQuery = true)
    List<Apartment> findBySiteId(@Param("siteId") String siteId);
    
    @Query(value = "SELECT a.* FROM apartments a " +
           "JOIN blocks b ON a.block_id = b.id " +
           "WHERE b.site_id IN :siteIds AND a.is_deleted = 0", 
           nativeQuery = true)
    List<Apartment> findBySiteIdIn(@Param("siteIds") List<String> siteIds);
    
    @Query(value = "SELECT COUNT(*) FROM apartments a " +
           "JOIN blocks b ON a.block_id = b.id " +
           "WHERE b.site_id = :siteId AND a.is_deleted = 0", 
           nativeQuery = true)
    long countBySiteId(@Param("siteId") String siteId);
    
    @Query(value = "SELECT a.* FROM apartments a " +
           "JOIN blocks b ON a.block_id = b.id " +
           "WHERE b.site_id = :siteId AND a.is_deleted = 0 " +
           "ORDER BY a.block_name ASC, CAST(a.unit_number AS UNSIGNED) ASC", 
           nativeQuery = true)
    List<Apartment> findBySiteIdOrderByBlockNameAscUnitNumberAsc(@Param("siteId") String siteId);
    
    // Kullanıcının residency_history tablosunda aktif olarak kayıtlı olduğu daireleri bul
    @Query(value = "SELECT DISTINCT a.* FROM apartments a " +
           "JOIN residency_history rh ON a.id = rh.apartment_id " +
           "WHERE rh.user_id = :userId AND rh.move_out_date IS NULL AND a.is_deleted = 0", 
           nativeQuery = true)
    List<Apartment> findByActiveResidency(@Param("userId") String userId);
}
