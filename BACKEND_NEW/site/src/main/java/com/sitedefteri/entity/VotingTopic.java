package com.sitedefteri.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "voting_topics")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class VotingTopic extends BaseEntity {
    
    @Column(name = "site_id", nullable = false, length = 36)
    private String siteId;
    
    @Column(name = "meeting_id", length = 36)
    private String meetingId;
    
    @Column(nullable = false, length = 255)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "voting_type", nullable = false, length = 50)
    private String votingType; // evet_hayir, coklu_secim, acik_oy
    
    @Column(columnDefinition = "JSON")
    private String options;
    
    @Column(nullable = false, length = 20)
    private String status; // taslak, aktif, kapali, iptal_edildi
    
    @Column(name = "starts_at")
    private LocalDateTime startsAt;
    
    @Column(name = "ends_at")
    private LocalDateTime endsAt;
    
    @Column(name = "requires_quorum", nullable = false)
    private Boolean requiresQuorum = false;
    
    @Column(name = "quorum_percentage")
    private Integer quorumPercentage;
    
    @Column(name = "total_votes")
    private Integer totalVotes = 0;
    
    @Column(columnDefinition = "JSON")
    private String results;
}
