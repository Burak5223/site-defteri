package com.sitedefteri.service;

import com.sitedefteri.dto.request.CastVoteRequest;
import com.sitedefteri.dto.request.CreateVotingRequest;
import com.sitedefteri.dto.response.VotingOptionResponse;
import com.sitedefteri.dto.response.VotingResponse;
import com.sitedefteri.entity.Apartment;
import com.sitedefteri.entity.UserVote;
import com.sitedefteri.entity.Voting;
import com.sitedefteri.entity.VotingOption;
import com.sitedefteri.repository.ApartmentRepository;
import com.sitedefteri.repository.UserVoteRepository;
import com.sitedefteri.repository.VotingOptionRepository;
import com.sitedefteri.repository.VotingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VotingServiceImpl {
    private final VotingRepository votingRepository;
    private final VotingOptionRepository votingOptionRepository;
    private final UserVoteRepository userVoteRepository;
    private final ApartmentRepository apartmentRepository;

    @Transactional
    public VotingResponse createVoting(CreateVotingRequest request, String siteId, String userId) {
        Voting voting = new Voting();
        voting.setSiteId(siteId);
        voting.setTitle(request.getTitle());
        voting.setDescription(request.getDescription());
        voting.setStartDate(request.getStartDate());
        voting.setEndDate(request.getEndDate());
        voting.setStatus("active");
        voting.setCreatedBy(userId);
        
        Voting savedVoting = votingRepository.save(voting);
        
        // Seçenekleri oluştur
        List<VotingOption> options = new ArrayList<>();
        for (int i = 0; i < request.getOptions().size(); i++) {
            VotingOption option = new VotingOption();
            option.setVoting(savedVoting);
            option.setOptionText(request.getOptions().get(i));
            option.setDisplayOrder(i);
            options.add(option);
        }
        votingOptionRepository.saveAll(options);
        
        return mapToResponse(savedVoting, null);
    }

    public List<VotingResponse> getVotings(String siteId, String userId) {
        List<Voting> votings = votingRepository.findBySiteIdOrderByCreatedAtDesc(siteId);
        return votings.stream()
                .map(v -> mapToResponse(v, userId))
                .collect(Collectors.toList());
    }
    
    public List<Voting> getVotingsBySiteId(String siteId) {
        return votingRepository.findBySiteIdOrderByCreatedAtDesc(siteId);
    }

    public VotingResponse getVotingById(Long id, String userId) {
        Voting voting = votingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Oylama bulunamadı"));
        return mapToResponse(voting, userId);
    }

    @Transactional
    public VotingResponse castVote(CastVoteRequest request, String userId, String apartmentId) {
        // Kullanıcının kiracı olup olmadığını kontrol et
        if (apartmentId != null) {
            Apartment apartment = apartmentRepository.findById(apartmentId)
                    .orElseThrow(() -> new RuntimeException("Daire bulunamadı"));
            
            // Eğer kullanıcı sadece kiracı ise (currentResident ama owner değil), oy kullanamaz
            boolean isCurrentResident = userId.equals(apartment.getCurrentResidentId());
            boolean isOwner = userId.equals(apartment.getOwnerUserId());
            
            if (isCurrentResident && !isOwner) {
                throw new RuntimeException("Kiracılar oylamaya katılamaz. Sadece kat malikleri oy kullanabilir.");
            }
            
            // Eğer ne owner ne de resident değilse, bu daire ile ilişkisi yok
            if (!isOwner && !isCurrentResident) {
                throw new RuntimeException("Bu daire ile ilişkiniz bulunmuyor");
            }
        }
        // apartmentId null ise, şimdilik izin ver (gelecekte user'dan apartment bilgisi alınacak)
        
        // Daha önce oy kullanılmış mı kontrol et
        if (userVoteRepository.existsByVotingIdAndUserId(request.getVotingId(), userId)) {
            throw new RuntimeException("Bu oylamada zaten oy kullandınız");
        }

        // Oylama aktif mi kontrol et
        Voting voting = votingRepository.findById(request.getVotingId())
                .orElseThrow(() -> new RuntimeException("Oylama bulunamadı"));
        
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(voting.getStartDate()) || now.isAfter(voting.getEndDate())) {
            throw new RuntimeException("Oylama süresi dolmuş veya henüz başlamamış");
        }

        // Oy kaydet
        UserVote vote = new UserVote();
        vote.setVotingId(request.getVotingId());
        vote.setOptionId(request.getOptionId());
        vote.setUserId(userId);
        vote.setApartmentId(apartmentId);
        userVoteRepository.save(vote);

        return mapToResponse(voting, userId);
    }

    private VotingResponse mapToResponse(Voting voting, String userId) {
        VotingResponse response = new VotingResponse();
        response.setId(voting.getId());
        response.setTitle(voting.getTitle());
        response.setDescription(voting.getDescription());
        response.setStartDate(voting.getStartDate());
        response.setEndDate(voting.getEndDate());
        response.setStatus(voting.getStatus());
        response.setCreatedBy(voting.getCreatedBy());
        response.setCreatedAt(voting.getCreatedAt());

        // Seçenekleri ve oy sayılarını getir
        List<VotingOption> options = votingOptionRepository.findByVoting_IdOrderByDisplayOrder(voting.getId());
        long totalVotes = userVoteRepository.findByVotingId(voting.getId()).size();
        
        List<VotingOptionResponse> optionResponses = options.stream().map(option -> {
            VotingOptionResponse optionResponse = new VotingOptionResponse();
            optionResponse.setId(option.getId());
            optionResponse.setOptionText(option.getOptionText());
            optionResponse.setDisplayOrder(option.getDisplayOrder());
            
            long voteCount = userVoteRepository.countByVotingIdAndOptionId(voting.getId(), option.getId());
            optionResponse.setVoteCount(voteCount);
            
            if (totalVotes > 0) {
                optionResponse.setPercentage((voteCount * 100.0) / totalVotes);
            } else {
                optionResponse.setPercentage(0.0);
            }
            
            return optionResponse;
        }).collect(Collectors.toList());

        response.setOptions(optionResponses);
        response.setTotalVotes(totalVotes);

        // Kullanıcı oy kullanmış mı?
        if (userId != null) {
            userVoteRepository.findByVotingIdAndUserId(voting.getId(), userId)
                    .ifPresentOrElse(
                            vote -> {
                                response.setHasVoted(true);
                                response.setUserVotedOptionId(vote.getOptionId());
                            },
                            () -> response.setHasVoted(false)
                    );
        }

        return response;
    }
}
