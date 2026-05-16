package com.sitedefteri.repository;

import com.sitedefteri.entity.Voting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface VotingRepository extends JpaRepository<Voting, Long> {
    List<Voting> findBySiteIdOrderByCreatedAtDesc(String siteId);
    List<Voting> findBySiteIdAndStatusOrderByCreatedAtDesc(String siteId, String status);
    List<Voting> findByStatusAndEndDateBefore(String status, LocalDateTime endDate);
}
