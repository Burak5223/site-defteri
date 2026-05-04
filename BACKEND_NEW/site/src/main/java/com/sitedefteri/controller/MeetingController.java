package com.sitedefteri.controller;

import com.sitedefteri.dto.request.CreateMeetingRequest;
import com.sitedefteri.entity.Meeting;
import com.sitedefteri.service.MeetingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class MeetingController {
    
    private final MeetingService meetingService;
    
    /**
     * Toplantıları listele
     * GET /api/sites/{siteId}/meetings
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'RESIDENT')")
    @GetMapping("/sites/{siteId}/meetings")
    public ResponseEntity<List<Meeting>> getMeetings(@PathVariable String siteId) {
        return ResponseEntity.ok(meetingService.getMeetings(siteId));
    }
    
    /**
     * Toplantı detayı
     * GET /api/meetings/{meetingId}
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'RESIDENT')")
    @GetMapping("/meetings/{meetingId}")
    public ResponseEntity<Meeting> getMeetingById(@PathVariable String meetingId) {
        return ResponseEntity.ok(meetingService.getMeetingById(meetingId));
    }
    
    /**
     * Yeni toplantı oluştur
     * POST /api/meetings
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/meetings")
    public ResponseEntity<Meeting> createMeeting(@Valid @RequestBody CreateMeetingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(meetingService.createMeeting(request));
    }
    
    /**
     * Toplantıya davet gönder
     * POST /api/meetings/{meetingId}/invite
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/meetings/{meetingId}/invite")
    public ResponseEntity<Map<String, String>> inviteToMeeting(
            @PathVariable String meetingId,
            @RequestBody Map<String, String> request) {
        String userId = request.get("userId");
        meetingService.inviteToMeeting(meetingId, userId);
        return ResponseEntity.ok(Map.of("message", "Davet gönderildi"));
    }
    
    /**
     * Toplantı katılımcılarını getir
     * GET /api/meetings/{meetingId}/attendees
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'RESIDENT')")
    @GetMapping("/meetings/{meetingId}/attendees")
    public ResponseEntity<List<String>> getMeetingAttendees(@PathVariable String meetingId) {
        return ResponseEntity.ok(meetingService.getMeetingAttendees(meetingId));
    }
    
    /**
     * Tüm toplantıları listele (all sites)
     * GET /api/meetings
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'RESIDENT', 'SUPER_ADMIN')")
    @GetMapping("/meetings")
    public ResponseEntity<List<Meeting>> getAllMeetings() {
        return ResponseEntity.ok(meetingService.getAllMeetings());
    }
}
