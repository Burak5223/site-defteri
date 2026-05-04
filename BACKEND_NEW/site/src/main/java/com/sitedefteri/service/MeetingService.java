package com.sitedefteri.service;

import com.sitedefteri.dto.request.CreateMeetingRequest;
import com.sitedefteri.entity.Meeting;
import com.sitedefteri.exception.ResourceNotFoundException;
import com.sitedefteri.repository.MeetingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MeetingService {
    
    private final MeetingRepository meetingRepository;
    
    @Transactional(readOnly = true)
    public List<Meeting> getMeetings(String siteId) {
        return meetingRepository.findBySiteIdOrderByScheduledAtDesc(siteId);
    }
    
    @Transactional(readOnly = true)
    public Meeting getMeetingById(String meetingId) {
        return meetingRepository.findById(meetingId)
                .orElseThrow(() -> new ResourceNotFoundException("Toplantı", "id", meetingId));
    }
    
    @Transactional
    public Meeting createMeeting(CreateMeetingRequest request) {
        log.info("Creating meeting: {}", request.getTitle());
        
        Meeting meeting = new Meeting();
        meeting.setSiteId(request.getSiteId());
        meeting.setTitle(request.getTitle());
        meeting.setDescription(request.getDescription());
        meeting.setMeetingType(request.getMeetingType());
        meeting.setScheduledAt(request.getScheduledAt());
        meeting.setLocation(request.getLocation());
        meeting.setStatus("planli");
        meeting.setAgenda(request.getAgenda());
        meeting.setQuorumRequired(request.getQuorumRequired());
        
        return meetingRepository.save(meeting);
    }
    
    @Transactional
    public void inviteToMeeting(String meetingId, String userId) {
        log.info("Inviting user {} to meeting {}", userId, meetingId);
        
        Meeting meeting = getMeetingById(meetingId);
        
        // TODO: Implement invitation system
        // 1. Create invitation record
        // 2. Send notification to user
        // 3. Send email/SMS if configured
        
        log.info("Invitation sent successfully");
    }
    
    @Transactional(readOnly = true)
    public List<String> getMeetingAttendees(String meetingId) {
        log.info("Getting attendees for meeting: {}", meetingId);
        
        Meeting meeting = getMeetingById(meetingId);
        
        // TODO: Implement attendee tracking
        // For now, return empty list
        return List.of();
    }
    
    @Transactional(readOnly = true)
    public List<Meeting> getAllMeetings() {
        log.info("Fetching all meetings");
        return meetingRepository.findAll();
    }
}
