package com.sitedefteri.repository;

import com.sitedefteri.entity.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, String> {
    List<Attachment> findByEntityTypeAndEntityId(String entityType, String entityId);
    List<Attachment> findBySiteIdOrderByCreatedAtDesc(String siteId);
}
