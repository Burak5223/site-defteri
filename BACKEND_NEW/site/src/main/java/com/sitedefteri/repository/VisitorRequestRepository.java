package com.sitedefteri.repository;

import com.sitedefteri.entity.VisitorRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VisitorRequestRepository extends JpaRepository<VisitorRequest, String> {
    
    List<VisitorRequest> findBySiteIdOrderByRequestDateDesc(String siteId);
    
    List<VisitorRequest> findByRequestedByOrderByRequestDateDesc(String requestedBy);
    
    List<VisitorRequest> findBySiteIdAndStatusOrderByRequestDateDesc(String siteId, String status);
    
    @Query("SELECT vr FROM VisitorRequest vr WHERE vr.siteId = :siteId AND vr.status = 'pending' ORDER BY vr.requestDate DESC")
    List<VisitorRequest> findPendingRequestsBySite(@Param("siteId") String siteId);
    
    long countBySiteIdAndStatus(String siteId, String status);
}
