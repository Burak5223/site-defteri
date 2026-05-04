package com.sitedefteri.repository;

import com.sitedefteri.entity.VisitorRequestItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VisitorRequestItemRepository extends JpaRepository<VisitorRequestItem, String> {
    
    List<VisitorRequestItem> findByVisitorRequestId(String requestId);
}
