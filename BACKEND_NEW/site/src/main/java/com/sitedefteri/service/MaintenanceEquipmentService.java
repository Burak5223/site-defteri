package com.sitedefteri.service;

import com.sitedefteri.entity.MaintenanceEquipment;
import com.sitedefteri.repository.MaintenanceEquipmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MaintenanceEquipmentService {
    
    private final MaintenanceEquipmentRepository maintenanceEquipmentRepository;
    
    public List<MaintenanceEquipment> getAllBySiteId(String siteId) {
        return maintenanceEquipmentRepository.findBySiteIdOrderByNextMaintenanceDateAsc(siteId);
    }
    
    public MaintenanceEquipment getById(String id) {
        return maintenanceEquipmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Maintenance equipment not found"));
    }
    
    @Transactional
    public MaintenanceEquipment create(MaintenanceEquipment equipment) {
        // Calculate next maintenance date if not provided
        if (equipment.getNextMaintenanceDate() == null && 
            equipment.getLastMaintenanceDate() != null && 
            equipment.getMaintenanceIntervalDays() != null) {
            equipment.setNextMaintenanceDate(
                equipment.getLastMaintenanceDate().plusDays(equipment.getMaintenanceIntervalDays())
            );
        }
        
        // Determine status based on next maintenance date
        if (equipment.getNextMaintenanceDate() != null) {
            LocalDate today = LocalDate.now();
            long daysUntil = java.time.temporal.ChronoUnit.DAYS.between(today, equipment.getNextMaintenanceDate());
            
            if (daysUntil < 0) {
                equipment.setStatus("overdue");
            } else if (daysUntil <= 7) {
                equipment.setStatus("due");
            } else {
                equipment.setStatus("upcoming");
            }
        }
        
        return maintenanceEquipmentRepository.save(equipment);
    }
    
    @Transactional
    public MaintenanceEquipment update(String id, MaintenanceEquipment equipment) {
        MaintenanceEquipment existing = getById(id);
        
        existing.setEquipmentName(equipment.getEquipmentName());
        existing.setEquipmentType(equipment.getEquipmentType());
        existing.setLastMaintenanceDate(equipment.getLastMaintenanceDate());
        existing.setMaintenanceIntervalDays(equipment.getMaintenanceIntervalDays());
        existing.setNotes(equipment.getNotes());
        
        // Recalculate next maintenance date
        if (equipment.getLastMaintenanceDate() != null && equipment.getMaintenanceIntervalDays() != null) {
            existing.setNextMaintenanceDate(
                equipment.getLastMaintenanceDate().plusDays(equipment.getMaintenanceIntervalDays())
            );
        }
        
        // Update status
        if (existing.getNextMaintenanceDate() != null) {
            LocalDate today = LocalDate.now();
            long daysUntil = java.time.temporal.ChronoUnit.DAYS.between(today, existing.getNextMaintenanceDate());
            
            if (daysUntil < 0) {
                existing.setStatus("overdue");
            } else if (daysUntil <= 7) {
                existing.setStatus("due");
            } else {
                existing.setStatus("upcoming");
            }
        }
        
        return maintenanceEquipmentRepository.save(existing);
    }
    
    @Transactional
    public void delete(String id) {
        maintenanceEquipmentRepository.deleteById(id);
    }
}
