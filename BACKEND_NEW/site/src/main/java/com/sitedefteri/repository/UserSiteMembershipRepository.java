package com.sitedefteri.repository;

import com.sitedefteri.entity.UserSiteMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserSiteMembershipRepository extends JpaRepository<UserSiteMembership, String> {
    List<UserSiteMembership> findByUserId(String userId);
    List<UserSiteMembership> findBySiteId(String siteId);
    List<UserSiteMembership> findBySiteIdIn(List<String> siteIds);
    List<UserSiteMembership> findByRoleType(String roleType);
    long countByRoleType(String roleType);
    long countBySiteIdAndRoleType(String siteId, String roleType);
}
