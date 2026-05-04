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
    
    // Performance calculation methods
    long countByStatusIn(List<String> statuses);
    
    // Site-specific performance methods
    long countBySiteId(String siteId);
    
    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.siteId = :siteId AND t.status IN :statuses")
    long countBySiteIdAndStatusIn(@Param("siteId") String siteId, @Param("statuses") List<String> statuses);
}
