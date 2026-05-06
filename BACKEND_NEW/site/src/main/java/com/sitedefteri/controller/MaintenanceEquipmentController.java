package com.sitedefteri.controller;

import com.sitedefteri.entity.MaintenanceEquipment;
import com.sitedefteri.service.MaintenanceEquipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MaintenanceEquipmentController {
    
    private final MaintenanceEquipmentService maintenanceEquipmentService;
    
    @GetMapping("/sites/{siteId}/maintenance")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'SECURITY', 'CLEANING', 'RESIDENT', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_SECURITY', 'ROLE_CLEANING', 'ROLE_RESIDENT')")
    public ResponseEntity<List<MaintenanceEquipment>> getAllBySite(@PathVariable String siteId) {
        List<MaintenanceEquipment> equipment = maintenanceEquipmentService.getAllBySiteId(siteId);
        return ResponseEntity.ok(equipment);
    }
    
    @GetMapping("/maintenance")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<List<MaintenanceEquipment>> getAllMaintenance() {
        List<MaintenanceEquipment> equipment = maintenanceEquipmentService.getAllBySiteId("1");
        return ResponseEntity.ok(equipment);
    }
    
    @GetMapping("/maintenance/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'SECURITY', 'CLEANING', 'RESIDENT', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_SECURITY', 'ROLE_CLEANING', 'ROLE_RESIDENT')")
    public ResponseEntity<MaintenanceEquipment> getById(@PathVariable String id) {
        MaintenanceEquipment equipment = maintenanceEquipmentService.getById(id);
        return ResponseEntity.ok(equipment);
    }
    
    @PostMapping("/sites/{siteId}/maintenance")
    @PreAuthorize("hasAnyRole('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<MaintenanceEquipment> create(
            @PathVariable String siteId,
            @RequestBody MaintenanceEquipment equipment) {
        equipment.setSiteId(siteId);
        MaintenanceEquipment created = maintenanceEquipmentService.create(equipment);
        return ResponseEntity.ok(created);
    }
    
    @PutMapping("/maintenance/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<MaintenanceEquipment> update(
            @PathVariable String id,
            @RequestBody MaintenanceEquipment equipment) {
        MaintenanceEquipment updated = maintenanceEquipmentService.update(id, equipment);
        return ResponseEntity.ok(updated);
    }
    
    @DeleteMapping("/maintenance/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        maintenanceEquipmentService.delete(id);
        return ResponseEntity.ok().build();
    }
}
