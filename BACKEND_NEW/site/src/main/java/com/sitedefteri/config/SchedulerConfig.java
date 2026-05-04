package com.sitedefteri.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Scheduler Configuration
 * 
 * Scheduled job'ları aktif eder
 * - Aidat hatırlatmaları (Her gün 10:00)
 * - Gecikmiş aidat hatırlatmaları (Her gün 14:00)
 */
@Configuration
@EnableScheduling
public class SchedulerConfig {
    // Scheduler'ı aktif et
}
