package com.sitedefteri.repository;

import com.sitedefteri.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
    Optional<User> findByUserQrToken(String userQrToken);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
    
    // Bildirimler için - apartmanda yaşayan kullanıcıları bul
    @Query(value = "SELECT DISTINCT u.* FROM users u " +
           "JOIN residency_history rh ON u.id = rh.user_id " +
           "WHERE rh.apartment_id = :apartmentId " +
           "AND rh.status = 'active' " +
           "AND rh.is_deleted = FALSE", 
           nativeQuery = true)
    List<User> findByApartmentId(@Param("apartmentId") String apartmentId);
    
    // Get residency info for a user in an apartment
    @Query(value = "SELECT rh.is_owner FROM residency_history rh " +
           "WHERE rh.user_id = :userId AND rh.apartment_id = :apartmentId " +
           "AND rh.status = 'active' AND rh.is_deleted = FALSE LIMIT 1", 
           nativeQuery = true)
    Boolean getIsOwnerByUserAndApartment(@Param("userId") String userId, @Param("apartmentId") String apartmentId);
    
    // Sitedeki tüm kullanıcıları bul
    @Query(value = "SELECT DISTINCT u.* FROM users u " +
           "JOIN user_site_memberships usm ON u.id = usm.user_id " +
           "WHERE usm.site_id = :siteId " +
           "AND usm.status = 'aktif'", 
           nativeQuery = true)
    List<User> findBySiteId(@Param("siteId") String siteId);
    
    // Kullanıcının rollerini bul (user_roles ve roles tablolarından)
    @Query(value = "SELECT r.name FROM user_roles ur " +
           "JOIN roles r ON ur.role_id = r.id " +
           "WHERE ur.user_id = :userId", 
           nativeQuery = true)
    List<String> findRolesByUserId(@Param("userId") String userId);
    
    // Kullanıcının site ID'lerini bul (user_site_memberships tablosundan)
    @Query(value = "SELECT usm.site_id FROM user_site_memberships usm " +
           "WHERE usm.user_id = :userId " +
           "AND usm.status = 'aktif' " +
           "AND usm.is_deleted = false", 
           nativeQuery = true)
    List<String> findSiteIdsByUserId(@Param("userId") String userId);
    
    // Belirli role sahip kullanıcıları bul
    @Query(value = "SELECT DISTINCT u.* FROM users u " +
           "JOIN user_roles ur ON u.id = ur.user_id " +
           "JOIN roles r ON ur.role_id = r.id " +
           "WHERE r.name = :roleName", 
           nativeQuery = true)
    List<User> findByRoles(@Param("roleName") String roleName);
    
    // Belirli sitede belirli role sahip kullanıcıları bul
    @Query(value = "SELECT DISTINCT u.* FROM users u " +
           "JOIN user_roles ur ON u.id = ur.user_id " +
           "JOIN roles r ON ur.role_id = r.id " +
           "JOIN user_site_memberships usm ON u.id = usm.user_id " +
           "WHERE usm.site_id = :siteId " +
           "AND r.name = :roleName " +
           "AND usm.status = 'aktif' " +
           "AND ur.is_deleted = false", 
           nativeQuery = true)
    List<User> findBySiteIdAndRole(@Param("siteId") String siteId, @Param("roleName") String roleName);
}
