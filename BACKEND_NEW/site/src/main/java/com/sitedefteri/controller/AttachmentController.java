package com.sitedefteri.controller;

import com.sitedefteri.dto.response.AttachmentResponse;
import com.sitedefteri.dto.response.PresignedUrlResponse;
import com.sitedefteri.service.AttachmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api/attachments")
@RequiredArgsConstructor
public class AttachmentController {
    
    private final AttachmentService attachmentService;
    
    @PreAuthorize("hasAnyRole('ADMIN', 'RESIDENT')")
    @GetMapping("/{entityType}/{entityId}")
    public ResponseEntity<List<AttachmentResponse>> getAttachments(
            @PathVariable String entityType,
            @PathVariable String entityId) {
        return ResponseEntity.ok(attachmentService.getAttachmentsByEntity(entityType, entityId));
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'RESIDENT')")
    @PostMapping("/upload")
    public ResponseEntity<AttachmentResponse> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("siteId") String siteId,
            @RequestParam("entityType") String entityType,
            @RequestParam("entityId") String entityId,
            Authentication authentication) throws IOException {
        
        String userId = authentication.getName();
        return ResponseEntity.ok(attachmentService.uploadFile(siteId, entityType, entityId, file, userId));
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'RESIDENT')")
    @GetMapping("/{attachmentId}")
    public ResponseEntity<AttachmentResponse> getAttachment(@PathVariable String attachmentId) {
        return ResponseEntity.ok(attachmentService.getAttachment(attachmentId));
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'RESIDENT')")
    @GetMapping("/{attachmentId}/download")
    public ResponseEntity<Resource> downloadFile(@PathVariable String attachmentId) throws IOException {
        AttachmentResponse attachment = attachmentService.getAttachment(attachmentId);
        
        Path filePath = Paths.get(attachment.getFilePath());
        Resource resource = new UrlResource(filePath.toUri());
        
        if (!resource.exists()) {
            throw new RuntimeException("Dosya bulunamadı: " + attachment.getFileName());
        }
        
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(attachment.getMimeType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, 
                        "attachment; filename=\"" + attachment.getFileName() + "\"")
                .body(resource);
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'RESIDENT')")
    @DeleteMapping("/{attachmentId}")
    public ResponseEntity<Void> deleteAttachment(@PathVariable String attachmentId) throws IOException {
        attachmentService.deleteAttachment(attachmentId);
        return ResponseEntity.noContent().build();
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'RESIDENT')")
    @PostMapping("/presign")
    public ResponseEntity<PresignedUrlResponse> generatePresignedUrl(
            @RequestParam String fileName,
            @RequestParam String entityType,
            @RequestParam String entityId) {
        return ResponseEntity.ok(attachmentService.generatePresignedUrl(fileName, entityType, entityId));
    }
}
