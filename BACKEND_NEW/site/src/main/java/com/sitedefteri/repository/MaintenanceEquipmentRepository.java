package com.sitedefteri.repository;

import com.sitedefteri.entity.MaintenanceEquipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaintenanceEquipmentRepository extends JpaRepository<MaintenanceEquipment, String> {
    
    List<MaintenanceEquipment> findBySiteIdOrderByNextMaintenanceDateAsc(String siteId);
    
    List<MaintenanceEquipment> findBySiteIdAndStatus(String siteId, String status);
}
