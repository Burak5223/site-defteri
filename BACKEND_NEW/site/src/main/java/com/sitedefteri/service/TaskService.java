package com.sitedefteri.service;

import com.sitedefteri.dto.request.CreateTaskRequest;
import com.sitedefteri.dto.response.TaskResponse;
import com.sitedefteri.entity.Task;
import com.sitedefteri.exception.ResourceNotFoundException;
import com.sitedefteri.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskService {
    
    private final TaskRepository taskRepository;
    
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
                    String assignedRole = task.getAssignedTo();
                    // Hem "ROLE_SECURITY" hem "SECURITY" formatını destekle
                    return assignedRole.equals(userRole) || 
                           assignedRole.equals("ROLE_" + userRole) ||
                           ("ROLE_" + assignedRole).equals(userRole);
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
        response.setAssignedTo(task.getAssignedTo());
        response.setDueDate(task.getDueDate());
        response.setStatus(task.getStatus().name());
        response.setCreatedAt(task.getCreatedAt());
        return response;
    }
}
