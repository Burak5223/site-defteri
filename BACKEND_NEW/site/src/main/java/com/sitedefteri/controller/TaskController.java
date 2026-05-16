package com.sitedefteri.controller;

import com.sitedefteri.dto.request.CreateTaskRequest;
import com.sitedefteri.dto.request.UpdateTaskStatusRequest;
import com.sitedefteri.dto.response.TaskResponse;
import com.sitedefteri.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TaskController {
    
    private final TaskService taskService;
    
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'SECURITY', 'CLEANING')")
    @GetMapping("/tasks")
    public ResponseEntity<List<TaskResponse>> getTasksSimple(Authentication authentication) {
        String userId = authentication.getName(); // JWT'den user ID gelir
        String userRole = getUserRole(authentication);
        return ResponseEntity.ok(taskService.getTasksByUser("1", userId, userRole));
    }
    
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'SECURITY', 'CLEANING')")
    @GetMapping("/sites/{siteId}/tasks")
    public ResponseEntity<List<TaskResponse>> getTasks(
            @PathVariable String siteId,
            Authentication authentication) {
        String userId = authentication.getName(); // JWT'den user ID gelir
        String userRole = getUserRole(authentication);
        return ResponseEntity.ok(taskService.getTasksByUser(siteId, userId, userRole));
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/tasks")
    public ResponseEntity<TaskResponse> createTaskSimple(@Valid @RequestBody CreateTaskRequest request) {
        return ResponseEntity.ok(taskService.createTask(request, "1"));
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/sites/{siteId}/tasks")
    public ResponseEntity<TaskResponse> createTask(
            @PathVariable String siteId,
            @Valid @RequestBody CreateTaskRequest request) {
        return ResponseEntity.ok(taskService.createTask(request, siteId));
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'SECURITY', 'CLEANING')")
    @PutMapping("/tasks/{taskId}/status")
    public ResponseEntity<TaskResponse> updateTaskStatusSimple(
            @PathVariable String taskId,
            @RequestBody UpdateTaskStatusRequest request) {
        return ResponseEntity.ok(taskService.updateTaskStatus(taskId, request.getStatus()));
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'SECURITY', 'CLEANING')")
    @PutMapping("/sites/{siteId}/tasks/{taskId}/status")
    public ResponseEntity<TaskResponse> updateTaskStatus(
            @PathVariable String siteId,
            @PathVariable String taskId,
            @RequestParam(required = false) String status,
            @RequestBody(required = false) UpdateTaskStatusRequest request) {
        // Support both query parameter and request body
        String statusValue = status != null ? status : (request != null ? request.getStatus() : null);
        if (statusValue == null) {
            throw new IllegalArgumentException("Status is required");
        }
        return ResponseEntity.ok(taskService.updateTaskStatus(taskId, statusValue));
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'SECURITY', 'CLEANING')")
    @PutMapping("/tasks/{taskId}/complete")
    public ResponseEntity<TaskResponse> completeTaskSimple(@PathVariable String taskId) {
        return ResponseEntity.ok(taskService.completeTask(taskId));
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'SECURITY', 'CLEANING')")
    @PutMapping("/sites/{siteId}/tasks/{taskId}/complete")
    public ResponseEntity<TaskResponse> completeTask(
            @PathVariable String siteId,
            @PathVariable String taskId) {
        return ResponseEntity.ok(taskService.completeTask(taskId));
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/sites/{siteId}/tasks/{taskId}")
    public ResponseEntity<TaskResponse> updateTask(
            @PathVariable String siteId,
            @PathVariable String taskId,
            @Valid @RequestBody CreateTaskRequest request) {
        return ResponseEntity.ok(taskService.updateTask(taskId, request));
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/sites/{siteId}/tasks/{taskId}")
    public ResponseEntity<Void> deleteTask(
            @PathVariable String siteId,
            @PathVariable String taskId) {
        taskService.deleteTask(taskId);
        return ResponseEntity.noContent().build();
    }
    
    private String getUserRole(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(role -> role.startsWith("ROLE_"))
                .findFirst()
                .orElse("ROLE_USER");
    }
}
