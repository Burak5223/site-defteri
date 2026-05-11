package com.sitedefteri.service;

import com.sitedefteri.dto.request.CreateTicketRequest;
import com.sitedefteri.dto.response.TicketResponse;
import com.sitedefteri.entity.Ticket;
import com.sitedefteri.exception.ResourceNotFoundException;
import com.sitedefteri.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketService {
    
    private final TicketRepository ticketRepository;
    
    public List<TicketResponse> getTicketsBySite(String siteId) {
        return ticketRepository.findBySiteIdOrderByCreatedAtDesc(siteId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    public List<TicketResponse> getMyTickets(String userId) {
        // Get user's apartment
        String apartmentId = getUserApartmentId(userId);
        
        if (apartmentId != null) {
            // Return all tickets for this apartment (including those created by admin)
            return ticketRepository.findByApartmentIdOrderByCreatedAtDesc(apartmentId)
                    .stream()
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        }
        
        // Fallback: return only user's own tickets
        return ticketRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    public TicketResponse createTicket(CreateTicketRequest request, String userId, String siteId) {
        Ticket ticket = new Ticket();
        ticket.setSiteId(siteId);
        ticket.setUserId(userId);
        ticket.setTicketNumber("TKT-" + System.currentTimeMillis());
        ticket.setTitle(request.getTitle());
        ticket.setDescription(request.getDescription());
        ticket.setCategory(request.getCategory());
        ticket.setCreatedBy(userId);
        
        // Set apartment ID - if not provided, try to get from user's residency
        String apartmentId = request.getApartmentId();
        if (apartmentId == null || apartmentId.isEmpty()) {
            // Try to get user's apartment from residency_history
            apartmentId = getUserApartmentId(userId);
            if (apartmentId != null) {
                log.info("Auto-assigned apartment {} to ticket for user {}", apartmentId, userId);
            }
        }
        ticket.setApartmentId(apartmentId);
        
        if (request.getPriority() != null) {
            ticket.setPriority(mapPriority(request.getPriority()));
        }
        
        Ticket saved = ticketRepository.save(ticket);
        return toResponse(saved);
    }
    
    /**
     * Helper: Get user's apartment ID from residency_history
     */
    private String getUserApartmentId(String userId) {
        try {
            // Query residency_history to find active apartment
            var result = ticketRepository.findApartmentByUserId(userId);
            if (!result.isEmpty()) {
                return result.get(0);
            }
        } catch (Exception e) {
            log.warn("Could not find apartment for user {}: {}", userId, e.getMessage());
        }
        return null;
    }
    
    private Ticket.Priority mapPriority(String priority) {
        if (priority == null) return Ticket.Priority.orta;
        
        String lowerPriority = priority.toLowerCase();
        switch (lowerPriority) {
            case "low":
            case "dusuk":
                return Ticket.Priority.dusuk;
            case "medium":
            case "orta":
                return Ticket.Priority.orta;
            case "high":
            case "yuksek":
                return Ticket.Priority.yuksek;
            case "urgent":
            case "acil":
                return Ticket.Priority.acil;
            default:
                return Ticket.Priority.orta;
        }
    }
    
    public TicketResponse updateStatus(String ticketId, String status) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Talep", "id", ticketId));
        
        try {
            // Map English status values to Turkish enum values
            Ticket.TicketStatus ticketStatus = mapStatusToEnum(status);
            ticket.setStatus(ticketStatus);
            
            // If resolved, set resolved timestamp
            if (ticketStatus == Ticket.TicketStatus.cozuldu) {
                ticket.setResolvedAt(LocalDateTime.now());
            }
            
            Ticket updated = ticketRepository.save(ticket);
            return toResponse(updated);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Geçersiz durum: " + status + 
                ". Geçerli durumlar: open, in_progress, resolved, closed veya acik, islemde, cozuldu, kapali");
        }
    }
    
    private Ticket.TicketStatus mapStatusToEnum(String status) {
        if (status == null) return Ticket.TicketStatus.acik;
        
        String lowerStatus = status.toLowerCase();
        switch (lowerStatus) {
            case "open":
            case "acik":
                return Ticket.TicketStatus.acik;
            case "in_progress":
            case "islemde":
                return Ticket.TicketStatus.islemde;
            case "waiting":
            case "kullanici_bekleniyor":
                return Ticket.TicketStatus.kullanici_bekleniyor;
            case "resolved":
            case "cozuldu":
                return Ticket.TicketStatus.cozuldu;
            case "closed":
            case "kapali":
                return Ticket.TicketStatus.kapali;
            case "rejected":
            case "reddedildi":
                return Ticket.TicketStatus.reddedildi;
            default:
                throw new IllegalArgumentException("Geçersiz durum: " + status);
        }
    }
    
    public TicketResponse assignTicket(String ticketId, String assignedTo) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Talep", "id", ticketId));
        
        ticket.setAssignedTo(assignedTo);
        ticket.setStatus(Ticket.TicketStatus.islemde);
        
        Ticket updated = ticketRepository.save(ticket);
        return toResponse(updated);
    }
    
    public TicketResponse closeTicket(String ticketId, String closedBy) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Talep", "id", ticketId));
        
        ticket.setStatus(Ticket.TicketStatus.kapali);
        ticket.setUpdatedBy(closedBy);
        
        Ticket updated = ticketRepository.save(ticket);
        return toResponse(updated);
    }
    
    public TicketResponse getTicketById(String ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Talep", "id", ticketId));
        return toResponse(ticket);
    }
    
    private TicketResponse toResponse(Ticket ticket) {
        TicketResponse response = new TicketResponse();
        response.setId(ticket.getId());
        response.setTitle(ticket.getTitle());
        response.setDescription(ticket.getDescription());
        response.setCategory(ticket.getCategory());
        // Map Turkish enum to English for frontend
        response.setStatus(mapEnumToStatus(ticket.getStatus()));
        response.setPriority(ticket.getPriority().name());
        response.setCreatedAt(ticket.getCreatedAt());
        return response;
    }
    
    private String mapEnumToStatus(Ticket.TicketStatus status) {
        switch (status) {
            case acik:
                return "open";
            case islemde:
                return "in_progress";
            case kullanici_bekleniyor:
                return "waiting";
            case cozuldu:
                return "resolved";
            case kapali:
                return "closed";
            case reddedildi:
                return "rejected";
            default:
                return "open";
        }
    }
    
    @Transactional
    public TicketResponse updateTicket(String ticketId, CreateTicketRequest request) {
        log.info("Updating ticket: {}", ticketId);
        
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Arıza", "id", ticketId));
        
        ticket.setTitle(request.getTitle());
        ticket.setDescription(request.getDescription());
        ticket.setCategory(request.getCategory());
        
        Ticket updated = ticketRepository.save(ticket);
        log.info("Ticket updated: {}", ticketId);
        return toResponse(updated);
    }
    
    @Transactional
    public void deleteTicket(String ticketId) {
        log.info("Deleting ticket: {}", ticketId);
        
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Arıza", "id", ticketId));
        
        ticketRepository.delete(ticket);
        log.info("Ticket deleted: {}", ticketId);
    }

}
