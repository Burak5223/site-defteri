package com.sitedefteri.repository;

import com.sitedefteri.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, String> {
    List<Ticket> findBySiteIdOrderByCreatedAtDesc(String siteId);
    List<Ticket> findByUserIdOrderByCreatedAtDesc(String userId);
    List<Ticket> findByApartmentIdOrderByCreatedAtDesc(String apartmentId);
    List<Ticket> findByApartmentIdInOrderByCreatedAtDesc(List<String> apartmentIds);
    
    // Performance calculation methods
    long countByStatusIn(List<String> statuses);
    
    // Site-specific performance methods
    long countBySiteId(String siteId);
    
    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.siteId = :siteId AND t.status IN :statuses")
    long countBySiteIdAndStatusIn(@Param("siteId") String siteId, @Param("statuses") List<String> statuses);
    
    // Get user's apartment from residency_history
    @Query(value = "SELECT apartment_id FROM residency_history WHERE user_id = :userId LIMIT 1", nativeQuery = true)
    List<String> findApartmentByUserId(@Param("userId") String userId);
    
    // Get all user's apartments from residency_history
    @Query(value = "SELECT apartment_id FROM residency_history WHERE user_id = :userId AND status = 'active'", nativeQuery = true)
    List<String> findAllApartmentsByUserId(@Param("userId") String userId);
    
    // Get site ID from apartment ID via blocks table
    @Query(value = "SELECT b.site_id FROM apartments a JOIN blocks b ON a.block_id = b.id WHERE a.id = :apartmentId LIMIT 1", nativeQuery = true)
    List<String> findSiteIdByApartmentId(@Param("apartmentId") String apartmentId);
}
