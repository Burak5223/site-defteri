package com.sitedefteri.repository;

import com.sitedefteri.entity.Meeting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MeetingRepository extends JpaRepository<Meeting, String> {
    List<Meeting> findBySiteIdOrderByScheduledAtDesc(String siteId);
    List<Meeting> findBySiteIdAndStatus(String siteId, String status);
}
