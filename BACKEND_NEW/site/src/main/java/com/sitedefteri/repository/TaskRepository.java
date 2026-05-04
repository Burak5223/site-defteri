package com.sitedefteri.repository;

import com.sitedefteri.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, String> {
    List<Task> findBySiteIdOrderByCreatedAtDesc(String siteId);
}
