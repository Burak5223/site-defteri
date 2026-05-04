package com.sitedefteri.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "meetings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Meeting extends BaseEntity {
    
    @Column(name = "site_id", nullable = false, length = 36)
    private String siteId;
    
    @Column(nullable = false, length = 255)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "meeting_type", nullable = false, length = 50)
    private String meetingType; // genel_kurul, yonetim_kurulu, olagan_disi
    
    @Column(name = "scheduled_at", nullable = false)
    private LocalDateTime scheduledAt;
    
    @Column(length = 255)
    private String location;
    
    @Column(nullable = false, length = 20)
    private String status; // planli, devam_ediyor, tamamlandi, iptal_edildi
    
    @Column(name = "started_at")
    private LocalDateTime startedAt;
    
    @Column(name = "ended_at")
    private LocalDateTime endedAt;
    
    @Column(columnDefinition = "TEXT")
    private String agenda;
    
    @Column(columnDefinition = "TEXT")
    private String minutes;
    
    @Column(name = "minutes_url", columnDefinition = "TEXT")
    private String minutesUrl;
    
    @Column(name = "quorum_required")
    private Integer quorumRequired;
    
    @Column(name = "quorum_met")
    private Integer quorumMet;
}
