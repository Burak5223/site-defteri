package com.sitedefteri.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sitedefteri.dto.request.CastTopicVoteRequest;
import com.sitedefteri.dto.request.CreateVotingTopicRequest;
import com.sitedefteri.entity.Vote;
import com.sitedefteri.entity.VotingTopic;
import com.sitedefteri.exception.BadRequestException;
import com.sitedefteri.exception.ResourceNotFoundException;
import com.sitedefteri.repository.VoteRepository;
import com.sitedefteri.repository.VotingTopicRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class VotingService {
    
    private final VotingTopicRepository votingTopicRepository;
    private final VoteRepository voteRepository;
    private final ObjectMapper objectMapper;
    
    @Transactional(readOnly = true)
    public List<VotingTopic> getVotingTopics(String siteId) {
        return votingTopicRepository.findBySiteIdOrderByCreatedAtDesc(siteId);
    }
    
    @Transactional
    public VotingTopic createVotingTopic(CreateVotingTopicRequest request) {
        log.info("Creating voting topic: {}", request.getTitle());
        
        VotingTopic topic = new VotingTopic();
        topic.setSiteId(request.getSiteId());
        topic.setMeetingId(request.getMeetingId());
        topic.setTitle(request.getTitle());
        topic.setDescription(request.getDescription());
        topic.setVotingType(request.getVotingType());
        topic.setOptions(request.getOptions());
        topic.setStatus("taslak");
        topic.setStartsAt(request.getStartsAt());
        topic.setEndsAt(request.getEndsAt());
        topic.setRequiresQuorum(request.getRequiresQuorum());
        topic.setQuorumPercentage(request.getQuorumPercentage());
        topic.setTotalVotes(0);
        
        return votingTopicRepository.save(topic);
    }
    
    @Transactional
    public Vote castVote(String topicId, String userId, CastTopicVoteRequest request) {
        log.info("Casting vote for topic: {} by user: {}", topicId, userId);
        
        VotingTopic topic = votingTopicRepository.findById(topicId)
                .orElseThrow(() -> new ResourceNotFoundException("Oylama", "id", topicId));
        
        // Check if voting is active
        if (!"aktif".equals(topic.getStatus())) {
            throw new BadRequestException("Bu oylama aktif değil");
        }
        
        // Check if voting period is valid
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(topic.getStartsAt()) || now.isAfter(topic.getEndsAt())) {
            throw new BadRequestException("Oylama süresi geçerli değil");
        }
        
        // Check if user already voted
        if (voteRepository.findByVotingTopicIdAndUserId(topicId, userId).isPresent()) {
            throw new BadRequestException("Bu oylamada zaten oy kullandınız");
        }
        
        // Create vote
        Vote vote = new Vote();
        vote.setVotingTopicId(topicId);
        vote.setUserId(userId);
        vote.setVoteValue(request.getVoteValue());
        vote.setComment(request.getComment());
        vote.setVotedAt(LocalDateTime.now());
        
        vote = voteRepository.save(vote);
        
        // Update topic vote count
        topic.setTotalVotes(topic.getTotalVotes() + 1);
        votingTopicRepository.save(topic);
        
        log.info("Vote cast successfully");
        return vote;
    }
    
    @Transactional(readOnly = true)
    public Map<String, Object> getVotingResults(String topicId) {
        log.info("Getting voting results for topic: {}", topicId);
        
        VotingTopic topic = votingTopicRepository.findById(topicId)
                .orElseThrow(() -> new ResourceNotFoundException("Oylama", "id", topicId));
        
        List<Vote> votes = voteRepository.findByVotingTopicId(topicId);
        
        Map<String, Object> results = new HashMap<>();
        results.put("topicId", topicId);
        results.put("title", topic.getTitle());
        results.put("status", topic.getStatus());
        results.put("totalVotes", votes.size());
        results.put("startsAt", topic.getStartsAt());
        results.put("endsAt", topic.getEndsAt());
        
        // Count votes by value
        Map<String, Long> voteCount = new HashMap<>();
        for (Vote vote : votes) {
            voteCount.put(vote.getVoteValue(), 
                    voteCount.getOrDefault(vote.getVoteValue(), 0L) + 1);
        }
        results.put("voteCount", voteCount);
        
        // Check quorum
        if (topic.getRequiresQuorum() && topic.getQuorumPercentage() != null) {
            // TODO: Calculate quorum based on total eligible voters
            results.put("requiresQuorum", true);
            results.put("quorumPercentage", topic.getQuorumPercentage());
        }
        
        return results;
    }
    
    @Transactional(readOnly = true)
    public List<VotingTopic> getAllVotings() {
        log.info("Fetching all votings");
        return votingTopicRepository.findAll();
    }
}
