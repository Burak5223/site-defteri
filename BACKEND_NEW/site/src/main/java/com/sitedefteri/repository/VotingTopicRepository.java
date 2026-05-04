package com.sitedefteri.repository;

import com.sitedefteri.entity.VotingTopic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VotingTopicRepository extends JpaRepository<VotingTopic, String> {
    List<VotingTopic> findBySiteIdOrderByCreatedAtDesc(String siteId);
    List<VotingTopic> findByMeetingId(String meetingId);
    List<VotingTopic> findBySiteIdAndStatus(String siteId, String status);
}
