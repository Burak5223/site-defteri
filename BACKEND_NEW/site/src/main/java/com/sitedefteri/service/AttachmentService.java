package com.sitedefteri.service;

import com.sitedefteri.dto.response.AttachmentResponse;
import com.sitedefteri.dto.response.PresignedUrlResponse;
import com.sitedefteri.entity.Attachment;
import com.sitedefteri.exception.ResourceNotFoundException;
import com.sitedefteri.repository.AttachmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AttachmentService {
    
    private final AttachmentRepository attachmentRepository;
    private static final String UPLOAD_DIR = "uploads/";
    
    @Transactional(readOnly = true)
    public List<AttachmentResponse> getAttachmentsByEntity(String entityType, String entityId) {
        log.info("Fetching attachments for {} {}", entityType, entityId);
        return attachmentRepository.findByEntityTypeAndEntityId(entityType, entityId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public AttachmentResponse uploadFile(
            String siteId,
            String entityType,
            String entityId,
            MultipartFile file,
            String userId) throws IOException {
        
        log.info("Uploading file: {} for {} {}", file.getOriginalFilename(), entityType, entityId);
        
        // Create upload directory if not exists
        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        
        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String fileExtension = originalFilename != null && originalFilename.contains(".") 
                ? originalFilename.substring(originalFilename.lastIndexOf(".")) 
                : "";
        String uniqueFilename = UUID.randomUUID().toString() + fileExtension;
        
        // Save file
        Path filePath = uploadPath.resolve(uniqueFilename);
        Files.copy(file.getInputStream(), filePath);
        
        // Create attachment record
        Attachment attachment = new Attachment();
        attachment.setSiteId(siteId);
        attachment.setEntityType(entityType);
        attachment.setEntityId(entityId);
        attachment.setFileName(originalFilename);
        attachment.setFilePath(filePath.toString());
        attachment.setFileSize(file.getSize());
        attachment.setMimeType(file.getContentType());
        attachment.setUploadedBy(userId);
        
        Attachment saved = attachmentRepository.save(attachment);
        log.info("File uploaded with ID: {}", saved.getId());
        
        return toResponse(saved);
    }
    
    @Transactional(readOnly = true)
    public AttachmentResponse getAttachment(String attachmentId) {
        log.info("Fetching attachment: {}", attachmentId);
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Dosya", "id", attachmentId));
        return toResponse(attachment);
    }
    
    @Transactional
    public void deleteAttachment(String attachmentId) throws IOException {
        log.info("Deleting attachment: {}", attachmentId);
        
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Dosya", "id", attachmentId));
        
        // Delete physical file
        Path filePath = Paths.get(attachment.getFilePath());
        if (Files.exists(filePath)) {
            Files.delete(filePath);
        }
        
        // Delete database record
        attachmentRepository.delete(attachment);
        log.info("Attachment deleted: {}", attachmentId);
    }
    
    public PresignedUrlResponse generatePresignedUrl(String fileName, String entityType, String entityId) {
        log.info("Generating presigned URL for: {}", fileName);
        
        // In a real implementation, this would generate a presigned URL for S3 or similar
        // For now, we'll return a mock response
        String fileId = UUID.randomUUID().toString();
        String uploadUrl = "/api/attachments/upload/" + fileId;
        
        PresignedUrlResponse response = new PresignedUrlResponse();
        response.setUploadUrl(uploadUrl);
        response.setFileId(fileId);
        response.setFileName(fileName);
        response.setExpiresIn(3600L); // 1 hour
        
        return response;
    }
    
    private AttachmentResponse toResponse(Attachment attachment) {
        AttachmentResponse response = new AttachmentResponse();
        response.setId(attachment.getId());
        response.setSiteId(attachment.getSiteId());
        response.setEntityType(attachment.getEntityType());
        response.setEntityId(attachment.getEntityId());
        response.setFileName(attachment.getFileName());
        response.setFilePath(attachment.getFilePath());
        response.setFileSize(attachment.getFileSize());
        response.setMimeType(attachment.getMimeType());
        response.setUploadedBy(attachment.getUploadedBy());
        response.setDescription(attachment.getDescription());
        response.setDownloadUrl("/api/attachments/" + attachment.getId() + "/download");
        response.setCreatedAt(attachment.getCreatedAt());
        return response;
    }
}
