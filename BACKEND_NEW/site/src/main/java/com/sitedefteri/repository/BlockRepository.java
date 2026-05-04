package com.sitedefteri.repository;

import com.sitedefteri.entity.Block;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BlockRepository extends JpaRepository<Block, String> {
    List<Block> findBySiteId(String siteId);
}
