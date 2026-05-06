package com.sitedefteri.controller;

import com.sitedefteri.dto.request.CreateBlockRequest;
import com.sitedefteri.dto.response.BlockResponse;
import com.sitedefteri.service.BlockService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sites/{siteId}/blocks")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BlockController {
    
    private final BlockService blockService;
    
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'SECURITY', 'CLEANING', 'ROLE_RESIDENT')")
    @GetMapping
    public ResponseEntity<List<BlockResponse>> getBlocks(@PathVariable String siteId) {
        return ResponseEntity.ok(blockService.getBlocksBySite(siteId));
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'SECURITY', 'CLEANING', 'ROLE_RESIDENT')")
    @GetMapping("/{id}")
    public ResponseEntity<BlockResponse> getBlock(@PathVariable String siteId, @PathVariable String id) {
        return ResponseEntity.ok(blockService.getBlockById(id));
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<BlockResponse> createBlock(
            @PathVariable String siteId,
            @Valid @RequestBody CreateBlockRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(blockService.createBlock(siteId, request));
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<BlockResponse> updateBlock(
            @PathVariable String siteId,
            @PathVariable String id,
            @Valid @RequestBody CreateBlockRequest request) {
        return ResponseEntity.ok(blockService.updateBlock(id, request));
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteBlock(
            @PathVariable String siteId,
            @PathVariable String id) {
        blockService.deleteBlock(id);
        return ResponseEntity.ok(Map.of("message", "Blok başarıyla silindi"));
    }
}
