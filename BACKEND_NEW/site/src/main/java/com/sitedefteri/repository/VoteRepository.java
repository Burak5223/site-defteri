package com.sitedefteri.repository;

import com.sitedefteri.entity.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VoteRepository extends JpaRepository<Vote, String> {
    List<Vote> findByVotingTopicId(String votingTopicId);
    Optional<Vote> findByVotingTopicIdAndUserId(String votingTopicId, String userId);
    long countByVotingTopicId(String votingTopicId);
}
