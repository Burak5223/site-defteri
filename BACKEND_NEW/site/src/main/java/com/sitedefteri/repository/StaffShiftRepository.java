package com.sitedefteri.repository;

import com.sitedefteri.entity.StaffShift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StaffShiftRepository extends JpaRepository<StaffShift, String> {
    List<StaffShift> findBySiteIdOrderByShiftDateDesc(String siteId);
    List<StaffShift> findBySiteIdAndShiftDateBetween(String siteId, LocalDateTime start, LocalDateTime end);
    List<StaffShift> findByStaffUserIdOrderByShiftDateDesc(String staffUserId);
}
