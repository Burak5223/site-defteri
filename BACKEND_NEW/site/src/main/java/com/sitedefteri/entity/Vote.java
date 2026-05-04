package com.sitedefteri.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "votes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Vote extends BaseEntity {
    
    @Column(name = "voting_topic_id", nullable = false, length = 36)
    private String votingTopicId;
    
    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;
    
    @Column(name = "apartment_id", length = 36)
    private String apartmentId;
    
    @Column(name = "vote_value", nullable = false, columnDefinition = "TEXT")
    private String voteValue;
    
    @Column(columnDefinition = "TEXT")
    private String comment;
    
    @Column(name = "voted_at", nullable = false)
    private java.time.LocalDateTime votedAt;
    
    @Column(name = "ip_address", length = 45)
    private String ipAddress;
}
