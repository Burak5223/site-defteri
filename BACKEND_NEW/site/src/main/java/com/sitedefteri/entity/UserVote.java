package com.sitedefteri.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_votes", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"voting_id", "user_id"})
})
@Data
public class UserVote {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "voting_id", nullable = false)
    private Long votingId;

    @Column(name = "option_id", nullable = false)
    private Long optionId;

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Column(name = "apartment_id", length = 36)
    private String apartmentId;

    @Column(name = "voted_at")
    private LocalDateTime votedAt;

    @PrePersist
    protected void onCreate() {
        votedAt = LocalDateTime.now();
    }
}
