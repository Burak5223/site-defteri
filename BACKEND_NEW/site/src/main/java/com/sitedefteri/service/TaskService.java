package com.sitedefteri.service;

import com.sitedefteri.dto.request.CreateTaskRequest;
import com.sitedefteri.dto.response.TaskResponse;
import com.sitedefteri.entity.Task;
import com.sitedefteri.exception.ResourceNotFoundException;
import com.sitedefteri.repository.TaskRepository;
import com.sitedefteri.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskService {
    
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    
    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksBySite(String siteId) {
        log.info("Fetching tasks for site: {}", siteId);
        return taskRepository.findBySiteIdOrderByCreatedAtDesc(siteId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksByRole(String siteId, String userRole) {
        log.info("Fetching tasks for site: {} and role: {}", siteId, userRole);
        
        // Admin tüm görevleri görebilir
        if ("ROLE_ADMIN".equals(userRole) || "ADMIN".equals(userRole)) {
            return getTasksBySite(siteId);
        }
        
        // Diğer roller sadece kendilerine atanan görevleri görebilir
        return taskRepository.findBySiteIdOrderByCreatedAtDesc(siteId)
                .stream()
                .filter(task -> {
                    String assignedRole = resolveAssignedRole(task);
                    // Hem "ROLE_SECURITY" hem "SECURITY" formatını destekle
                    return assignedRole != null && (
                           assignedRole.equals(userRole) || 
                           assignedRole.equals("ROLE_" + userRole) ||
                           ("ROLE_" + assignedRole).equals(userRole));
                })
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksByUser(String siteId, String userId, String userRole) {
        log.info("Fetching tasks for site: {}, user: {} and role: {}", siteId, userId, userRole);
        
        // Admin tüm görevleri görebilir
        if ("ROLE_ADMIN".equals(userRole) || "ADMIN".equals(userRole) || 
            "ROLE_SUPER_ADMIN".equals(userRole) || "SUPER_ADMIN".equals(userRole)) {
            return getTasksBySite(siteId);
        }
        
        // Diğer roller sadece kendilerine atanan görevleri görebilir (assigned_to = user_id)
        return taskRepository.findBySiteIdOrderByCreatedAtDesc(siteId)
                .stream()
                .filter(task -> {
                    String assignedTo = task.getAssignedTo();
                    String assignedRole = resolveAssignedRole(task);
                    // Eski kayitlarda user ID, yeni kayitlarda rol tutulabiliyor.
                    return (assignedTo != null && assignedTo.equals(userId)) ||
                           (assignedRole != null && assignedRole.equals(userRole));
                })
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public TaskResponse createTask(CreateTaskRequest request, String siteId) {
        log.info("Creating task for site: {} with assigned role: {}", siteId, request.getAssignedTo());
        
        Task task = new Task();
        task.setSiteId(siteId);
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        // assignedTo artık rol olarak kullanılıyor (ROLE_SECURITY, ROLE_CLEANING, vb.)
        task.setAssignedTo(request.getAssignedTo());
        task.setDueDate(request.getDueDate());
        task.setTaskType(request.getTaskType());
        task.setLocation(request.getLocation());
        task.setStatus(Task.TaskStatus.bekliyor);
        
        Task saved = taskRepository.save(task);
        log.info("Task created with ID: {} for role: {}", saved.getId(), saved.getAssignedTo());
        return toResponse(saved);
    }
    
    @Transactional
    public TaskResponse updateTaskStatus(String taskId, String status) {
        log.info("Updating task status: {} to {}", taskId, status);
        
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Görev", "id", taskId));
        
        // Status mapping: İngilizce -> Türkçe
        String mappedStatus = mapStatusToTurkish(status);
        task.setStatus(Task.TaskStatus.valueOf(mappedStatus));
        Task updated = taskRepository.save(task);
        log.info("Task status updated from {} to {}", status, mappedStatus);
        return toResponse(updated);
    }
    
    private String mapStatusToTurkish(String status) {
        // Eğer zaten Türkçe ise direkt kullan
        if (status.equals("bekliyor") || status.equals("devam_ediyor") || 
            status.equals("tamamlandi") || status.equals("iptal_edildi")) {
            return status;
        }
        
        // İngilizce -> Türkçe mapping
        switch (status.toUpperCase()) {
            case "PENDING":
            case "WAITING":
                return "bekliyor";
            case "IN_PROGRESS":
            case "ONGOING":
                return "devam_ediyor";
            case "COMPLETED":
            case "DONE":
                return "tamamlandi";
            case "CANCELLED":
            case "CANCELED":
                return "iptal_edildi";
            default:
                log.warn("Unknown status: {}, defaulting to bekliyor", status);
                return "bekliyor";
        }
    }
    
    @Transactional
    public TaskResponse completeTask(String taskId) {
        log.info("Completing task: {}", taskId);
        
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Görev", "id", taskId));
        
        task.setStatus(Task.TaskStatus.tamamlandi);
        Task updated = taskRepository.save(task);
        return toResponse(updated);
    }
    
    @Transactional
    public TaskResponse updateTask(String taskId, CreateTaskRequest request) {
        log.info("Updating task: {}", taskId);
        
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Görev", "id", taskId));
        
        if (request.getTitle() != null) {
            task.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            task.setDescription(request.getDescription());
        }
        if (request.getAssignedTo() != null) {
            task.setAssignedTo(request.getAssignedTo());
        }
        if (request.getDueDate() != null) {
            task.setDueDate(request.getDueDate());
        }
        if (request.getTaskType() != null) {
            task.setTaskType(request.getTaskType());
        }
        if (request.getLocation() != null) {
            task.setLocation(request.getLocation());
        }
        
        Task updated = taskRepository.save(task);
        log.info("Task updated: {}", taskId);
        return toResponse(updated);
    }
    
    @Transactional
    public void deleteTask(String taskId) {
        log.info("Deleting task: {}", taskId);
        
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Görev", "id", taskId));
        
        taskRepository.delete(task);
        log.info("Task deleted: {}", taskId);
    }
    
    private TaskResponse toResponse(Task task) {
        TaskResponse response = new TaskResponse();
        response.setId(task.getId());
        response.setTitle(task.getTitle());
        response.setDescription(task.getDescription());
        response.setAssignedTo(resolveAssignedRole(task));
        response.setTaskType(task.getTaskType());
        response.setDueDate(task.getDueDate());
        response.setStatus(task.getStatus().name());
        response.setCreatedAt(task.getCreatedAt());
        return response;
    }

    private String resolveAssignedRole(Task task) {
        String assignedTo = task.getAssignedTo();
        String assignedRole = normalizeRole(assignedTo);
        if (assignedRole != null) {
            return assignedRole;
        }

        if (assignedTo != null && !assignedTo.isBlank()) {
            String userRole = userRepository.findRolesByUserId(assignedTo).stream()
                    .map(this::normalizeRole)
                    .filter(role -> role != null)
                    .filter(role -> role.equals("ROLE_SECURITY") ||
                                    role.equals("ROLE_CLEANING") ||
                                    role.equals("ROLE_MAINTENANCE"))
                    .findFirst()
                    .orElse(null);
            if (userRole != null) {
                return userRole;
            }
        }

        String inferredRole = normalizeRole(task.getTaskType());
        if (inferredRole != null) {
            return inferredRole;
        }

        inferredRole = normalizeRole(task.getTitle());
        if (inferredRole != null) {
            return inferredRole;
        }

        String descriptionRole = normalizeRole(task.getDescription());
        if (descriptionRole != null) {
            return descriptionRole;
        }

        return "ROLE_SECURITY";
    }

    private String normalizeRole(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String normalized = value.trim()
                .toUpperCase(Locale.forLanguageTag("tr-TR"))
                .replaceAll("\\s+", "_");

        if (normalized.contains("ROLE_SECURITY") || normalized.equals("SECURITY") ||
            normalized.contains("GUVEN") || normalized.contains("GÜVEN") ||
            normalized.contains("GÃ") || normalized.contains("GUVENLIK")) {
            return "ROLE_SECURITY";
        }
        if (normalized.contains("ROLE_CLEANING") || normalized.equals("CLEANING") ||
            normalized.contains("TEMIZ") || normalized.contains("TEMİZ") ||
            normalized.contains("TEMIZLIK")) {
            return "ROLE_CLEANING";
        }
        if (normalized.contains("ROLE_MAINTENANCE") || normalized.equals("MAINTENANCE") ||
            normalized.contains("BAKIM") || normalized.contains("BAKÄ")) {
            return "ROLE_MAINTENANCE";
        }

        return null;
    }
}
