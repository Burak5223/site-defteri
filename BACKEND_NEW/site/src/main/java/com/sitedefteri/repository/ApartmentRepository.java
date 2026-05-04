package com.sitedefteri.repository;

import com.sitedefteri.entity.Apartment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApartmentRepository extends JpaRepository<Apartment, String> {
    List<Apartment> findByBlockId(String blockId);
    List<Apartment> findByOwnerUserId(String ownerUserId);
    List<Apartment> findByCurrentResidentId(String currentResidentId);
    
    // Kullanıcının sakin veya sahibi olduğu apartmanları bul
    List<Apartment> findByCurrentResidentIdOrOwnerUserId(String currentResidentId, String ownerUserId);
    
    @Query(value = "SELECT a.* FROM apartments a " +
           "JOIN blocks b ON a.block_id = b.id " +
           "WHERE b.site_id = :siteId", 
           nativeQuery = true)
    List<Apartment> findBySiteId(@Param("siteId") String siteId);
    
    @Query(value = "SELECT COUNT(*) FROM apartments a " +
           "JOIN blocks b ON a.block_id = b.id " +
           "WHERE b.site_id = :siteId", 
           nativeQuery = true)
    long countBySiteId(@Param("siteId") String siteId);
}
