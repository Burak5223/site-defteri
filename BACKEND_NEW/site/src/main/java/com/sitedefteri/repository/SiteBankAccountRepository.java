package com.sitedefteri.repository;

import com.sitedefteri.entity.SiteBankAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SiteBankAccountRepository extends JpaRepository<SiteBankAccount, String> {
    List<SiteBankAccount> findBySiteIdAndIsActiveTrue(String siteId);
    List<SiteBankAccount> findBySiteId(String siteId);
}
