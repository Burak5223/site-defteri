package com.sitedefteri.repository;

import com.sitedefteri.entity.VotingOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface VotingOptionRepository extends JpaRepository<VotingOption, Long> {
    List<VotingOption> findByVoting_IdOrderByDisplayOrder(Long votingId);
}
