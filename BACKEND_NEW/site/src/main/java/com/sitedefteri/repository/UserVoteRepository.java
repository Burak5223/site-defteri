package com.sitedefteri.repository;

import com.sitedefteri.entity.UserVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserVoteRepository extends JpaRepository<UserVote, Long> {
    Optional<UserVote> findByVotingIdAndUserId(Long votingId, String userId);
    List<UserVote> findByVotingId(Long votingId);
    
    @Query("SELECT COUNT(v) FROM UserVote v WHERE v.votingId = :votingId AND v.optionId = :optionId")
    long countByVotingIdAndOptionId(Long votingId, Long optionId);
    
    boolean existsByVotingIdAndUserId(Long votingId, String userId);
}
