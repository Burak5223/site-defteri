package com.sitedefteri.repository;

import com.sitedefteri.entity.ResidentCargoNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResidentCargoNotificationRepository extends JpaRepository<ResidentCargoNotification, Long> {

    /**
     * Find pending notifications by normalized name for matching
     */
    @Query("SELECT n FROM ResidentCargoNotification n WHERE " +
           "n.status = 'pending_match' AND " +
           "n.siteId = :siteId AND " +
           "LOWER(n.fullNameNormalized) = LOWER(:normalizedName) " +
           "ORDER BY n.createdAt DESC")
    List<ResidentCargoNotification> findPendingByNormalizedName(
        @Param("siteId") String siteId,
        @Param("normalizedName") String normalizedName
    );

    /**
     * Find all notifications for a resident
     */
    List<ResidentCargoNotification> findByResidentIdOrderByCreatedAtDesc(String residentId);

    /**
     * Find pending notifications for a site
     */
    List<ResidentCargoNotification> findBySiteIdAndStatusOrderByCreatedAtDesc(String siteId, String status);

    /**
     * Find notification by ID and site (for security)
     */
    Optional<ResidentCargoNotification> findByIdAndSiteId(Long id, String siteId);
}
