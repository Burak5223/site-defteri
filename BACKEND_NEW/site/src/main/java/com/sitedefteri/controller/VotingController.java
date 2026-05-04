package com.sitedefteri.controller;

import com.sitedefteri.dto.request.CastTopicVoteRequest;
import com.sitedefteri.dto.request.CastVoteRequest;
import com.sitedefteri.dto.request.CreateVotingRequest;
import com.sitedefteri.dto.request.CreateVotingTopicRequest;
import com.sitedefteri.dto.response.VotingResponse;
import com.sitedefteri.entity.Vote;
import com.sitedefteri.entity.Voting;
import com.sitedefteri.security.SecurityUtils;
import com.sitedefteri.service.VotingServiceImpl;
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
public class VotingController {
    
    private final VotingServiceImpl votingService;
    private final SecurityUtils securityUtils;
    
    /**
     * Oylama konularını listele
     * GET /api/sites/{siteId}/voting-topics
     */
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'RESIDENT')")
    @GetMapping("/sites/{siteId}/voting-topics")
    public ResponseEntity<List<VotingResponse>> getVotingTopics(@PathVariable String siteId) {
        String userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(votingService.getVotings(siteId, userId));
    }
    
    /**
     * Oylama konularını listele (alias endpoint)
     * GET /api/sites/{siteId}/e-voting
     */
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'RESIDENT')")
    @GetMapping("/sites/{siteId}/e-voting")
    public ResponseEntity<List<VotingResponse>> getEVoting(@PathVariable String siteId) {
        String userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(votingService.getVotings(siteId, userId));
    }
    
    /**
     * Oylama konularını listele (alias endpoint)
     * GET /api/sites/{siteId}/voting
     */
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'RESIDENT')")
    @GetMapping("/sites/{siteId}/voting")
    public ResponseEntity<List<VotingResponse>> getVotingBySite(@PathVariable String siteId) {
        String userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(votingService.getVotings(siteId, userId));
    }
    
    /**
     * Yeni oylama oluştur (alias endpoint)
     * POST /api/sites/{siteId}/e-voting
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/sites/{siteId}/e-voting")
    public ResponseEntity<VotingResponse> createEVoting(
            @PathVariable String siteId,
            @Valid @RequestBody CreateVotingRequest request) {
        String userId = securityUtils.getCurrentUserId();
        log.info("Creating e-voting for site: {} by user: {}", siteId, userId);
        VotingResponse voting = votingService.createVoting(request, siteId, userId);
        return ResponseEntity.ok(voting);
    }
    
    /**
     * Yeni oylama oluştur
     * POST /api/sites/{siteId}/voting-topics
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/sites/{siteId}/voting-topics")
    public ResponseEntity<VotingResponse> createVotingTopic(
            @PathVariable String siteId,
            @Valid @RequestBody CreateVotingRequest request) {
        String userId = securityUtils.getCurrentUserId();
        log.info("Creating voting topic for site: {} by user: {}", siteId, userId);
        VotingResponse voting = votingService.createVoting(request, siteId, userId);
        return ResponseEntity.ok(voting);
    }
    
    /**
     * Oy kullan
     * POST /api/e-voting/vote
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'RESIDENT')")
    @PostMapping("/e-voting/vote")
    public ResponseEntity<VotingResponse> castVoteSimple(@Valid @RequestBody CastVoteRequest request) {
        String userId = securityUtils.getCurrentUserId();
        // TODO: Get apartmentId from user
        String apartmentId = null; // For now, we'll allow voting without apartment check
        log.info("User {} casting vote for voting {} option {}", userId, request.getVotingId(), request.getOptionId());
        VotingResponse voting = votingService.castVote(request, userId, apartmentId);
        return ResponseEntity.ok(voting);
    }
    
    /**
     * Oy kullan
     * POST /api/sites/{siteId}/voting-topics/{topicId}/cast
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'RESIDENT')")
    @PostMapping("/sites/{siteId}/voting-topics/{topicId}/cast")
    public ResponseEntity<Vote> castVote(
            @PathVariable String siteId,
            @PathVariable String topicId,
            @Valid @RequestBody CastTopicVoteRequest request) {
        // TODO: Implement castVote in service
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
    }
    
    /**
     * Oylama sonuçlarını getir
     * GET /api/sites/{siteId}/voting-topics/{topicId}/results
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'RESIDENT')")
    @GetMapping("/sites/{siteId}/voting-topics/{topicId}/results")
    public ResponseEntity<Map<String, Object>> getVotingResults(
            @PathVariable String siteId,
            @PathVariable String topicId) {
        // TODO: Implement getVotingResults in service
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
    }
    
    /**
     * Tüm oylamaları listele (all sites)
     * GET /api/votings
     */
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'RESIDENT')")
    @GetMapping("/votings")
    public ResponseEntity<List<Voting>> getAllVotings() {
        // TODO: Implement getAllVotings in service
        return ResponseEntity.ok(List.of());
    }
    
    /**
     * Tüm oylamaları listele (alias)
     * GET /api/voting
     */
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'RESIDENT')")
    @GetMapping("/voting")
    public ResponseEntity<List<VotingResponse>> getAllVotingsSimple() {
        String userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(votingService.getVotings("1", userId));
    }
}
