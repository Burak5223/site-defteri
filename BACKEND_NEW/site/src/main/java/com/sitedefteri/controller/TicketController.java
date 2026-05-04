package com.sitedefteri.controller;

import com.sitedefteri.dto.request.CreateTicketRequest;
import com.sitedefteri.dto.response.TicketResponse;
import com.sitedefteri.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TicketController {
    
    private final TicketService ticketService;
    
    /**
     * Get all tickets (backward compatibility)
     * GET /api/tickets
     */
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'RESIDENT', 'SECURITY', 'CLEANING')")
    @GetMapping("/tickets")
    public ResponseEntity<List<TicketResponse>> getAllTickets(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.ok(List.of());
        }
        String userId = authentication.getName();
        // Kullanıcının kendi ticket'larını döndür
        return ResponseEntity.ok(ticketService.getMyTickets(userId));
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'RESIDENT', 'SECURITY', 'CLEANING')")
    @GetMapping("/tickets/my")
    public ResponseEntity<List<TicketResponse>> getMyTickets(Authentication authentication) {
        String userId = authentication.getName();
        return ResponseEntity.ok(ticketService.getMyTickets(userId));
    }
    
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'RESIDENT', 'SECURITY', 'CLEANING')")
    @GetMapping("/sites/{siteId}/tickets")
    public ResponseEntity<List<TicketResponse>> getTickets(@PathVariable String siteId) {
        return ResponseEntity.ok(ticketService.getTicketsBySite(siteId));
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'RESIDENT', 'SECURITY', 'CLEANING')")
    @PostMapping("/sites/{siteId}/tickets")
    public ResponseEntity<TicketResponse> createTicket(
            @PathVariable String siteId,
            @Valid @RequestBody CreateTicketRequest request,
            Authentication authentication) {
        String userId = authentication.getName();
        return ResponseEntity.ok(ticketService.createTicket(request, userId, siteId));
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/sites/{siteId}/tickets/{ticketId}/status")
    public ResponseEntity<TicketResponse> updateStatus(
            @PathVariable String siteId,
            @PathVariable String ticketId,
            @RequestBody Map<String, String> request) {
        String status = request.get("status");
        return ResponseEntity.ok(ticketService.updateStatus(ticketId, status));
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'RESIDENT', 'SECURITY', 'CLEANING')")
    @GetMapping("/sites/{siteId}/tickets/{ticketId}")
    public ResponseEntity<TicketResponse> getTicket(
            @PathVariable String siteId,
            @PathVariable String ticketId) {
        return ResponseEntity.ok(ticketService.getTicketById(ticketId));
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/sites/{siteId}/tickets/{ticketId}/assign")
    public ResponseEntity<TicketResponse> assignTicket(
            @PathVariable String siteId,
            @PathVariable String ticketId,
            @RequestBody Map<String, String> request) {
        String assignedTo = request.get("assignedTo");
        return ResponseEntity.ok(ticketService.assignTicket(ticketId, assignedTo));
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/sites/{siteId}/tickets/{ticketId}/close")
    public ResponseEntity<TicketResponse> closeTicket(
            @PathVariable String siteId,
            @PathVariable String ticketId,
            Authentication authentication) {
        String closedBy = authentication.getName();
        return ResponseEntity.ok(ticketService.closeTicket(ticketId, closedBy));
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/sites/{siteId}/tickets/{ticketId}")
    public ResponseEntity<TicketResponse> updateTicket(
            @PathVariable String siteId,
            @PathVariable String ticketId,
            @Valid @RequestBody CreateTicketRequest request) {
        return ResponseEntity.ok(ticketService.updateTicket(ticketId, request));
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/sites/{siteId}/tickets/{ticketId}")
    public ResponseEntity<Void> deleteTicket(
            @PathVariable String siteId,
            @PathVariable String ticketId) {
        ticketService.deleteTicket(ticketId);
        return ResponseEntity.noContent().build();
    }
}
