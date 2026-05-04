package com.sitedefteri.config;

import com.sitedefteri.service.TelegramBotService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.meta.TelegramBotsApi;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;
import org.telegram.telegrambots.updatesreceivers.DefaultBotSession;

/**
 * Telegram Bot Başlatıcı
 * Backend başladığında Telegram bot'u otomatik olarak başlatır
 */
@Component
@Slf4j
public class TelegramBotInitializer implements ApplicationRunner {

    @Autowired
    private TelegramBotService telegramBotService;

    @Override
    public void run(ApplicationArguments args) {
        try {
            log.info("🤖 Telegram bot başlatılıyor...");
            
            TelegramBotsApi botsApi = new TelegramBotsApi(DefaultBotSession.class);
            botsApi.registerBot(telegramBotService);
            
            log.info("✅ Telegram bot başarıyla başlatıldı!");
            log.info("📱 Bot Username: {}", telegramBotService.getBotUsername());
            log.info("🔗 Bot Link: https://t.me/{}", telegramBotService.getBotUsername());
            
        } catch (TelegramApiException e) {
            log.error("❌ Telegram bot başlatılamadı!", e);
            log.error("⚠️  OTP sistemi çalışmayacak!");
        }
    }
}
