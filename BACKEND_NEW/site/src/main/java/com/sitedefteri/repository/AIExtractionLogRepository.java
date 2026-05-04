package com.sitedefteri.repository;

import com.sitedefteri.entity.AIExtractionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AIExtractionLogRepository extends JpaRepository<AIExtractionLog, Long> {

    /**
     * Count API calls for a site today (for rate limiting)
     */
    @Query("SELECT COUNT(l) FROM AIExtractionLog l WHERE " +
           "l.siteId = :siteId AND " +
           "l.createdAt >= :startOfDay")
    long countTodayCallsBySite(
        @Param("siteId") String siteId,
        @Param("startOfDay") LocalDateTime startOfDay
    );

    /**
     * Find logs with photos older than specified date (for deletion)
     */
    @Query("SELECT l FROM AIExtractionLog l WHERE " +
           "l.photoPath IS NOT NULL AND " +
           "l.photoDeletedAt IS NULL AND " +
           "l.createdAt < :beforeDate")
    List<AIExtractionLog> findPhotosOlderThan(@Param("beforeDate") LocalDateTime beforeDate);

    /**
     * Find logs by site for audit
     */
    List<AIExtractionLog> findBySiteIdOrderByCreatedAtDesc(String siteId);
}
