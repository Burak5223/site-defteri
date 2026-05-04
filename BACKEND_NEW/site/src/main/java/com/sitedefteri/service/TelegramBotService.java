package com.sitedefteri.service;

import com.sitedefteri.entity.User;
import com.sitedefteri.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.bots.TelegramLongPollingBot;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.Message;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.ReplyKeyboardMarkup;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.buttons.KeyboardButton;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.buttons.KeyboardRow;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Component
@Slf4j
public class TelegramBotService extends TelegramLongPollingBot {

    private final UserRepository userRepository;
    
    @Value("${telegram.bot.token}")
    private String botToken;
    
    @Value("${telegram.bot.username}")
    private String botUsername;

    public TelegramBotService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public String getBotUsername() {
        return botUsername;
    }

    @Override
    public String getBotToken() {
        return botToken;
    }

    @Override
    public void onUpdateReceived(Update update) {
        if (update.hasMessage()) {
            Message message = update.getMessage();
            Long chatId = message.getChatId();

            // SENARYO 1: Kullanıcı deep link ile geldiğinde (/start PHONE_5539304912)
            if (message.hasText() && message.getText().startsWith("/start")) {
                String text = message.getText();
                
                // Deep link parametresini kontrol et
                if (text.contains("PHONE_")) {
                    // Telefon numarasını URL'den al
                    String phoneParam = text.substring(text.indexOf("PHONE_") + 6).trim();
                    log.info("Deep link phone parameter: {}", phoneParam);
                    
                    // Otomatik OTP gönder
                    sendOtpAutomatically(chatId, phoneParam);
                } else {
                    // Normal /start komutu - telefon numarası paylaşma butonu gönder
                    sendPhoneRequestButton(chatId);
                }
            }
            // SENARYO 2: Kullanıcı "Numaramı Paylaş" butonuna bastığında (fallback)
            else if (message.hasContact()) {
                String phoneNumber = message.getContact().getPhoneNumber();
                verifyPhoneAndSendCode(chatId, phoneNumber);
            }
        }
    }
    
    /**
     * Deep link'ten gelen telefon numarası ile otomatik OTP gönder
     */
    private void sendOtpAutomatically(Long chatId, String phoneParam) {
        log.info("Sending OTP automatically for phone: {}", phoneParam);
        
        // Telefon numarasını normalize et
        String normalizedPhone = normalizePhoneNumber(phoneParam);
        
        // Veritabanında bu telefon numarasını ara
        Optional<User> userOpt = userRepository.findByPhone(normalizedPhone);
        
        SendMessage response = new SendMessage();
        response.setChatId(chatId.toString());

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            
            // Kullanıcının zaten OTP kodu var mı kontrol et
            if (user.getOtpCode() != null && user.getOtpExpiry() != null && 
                user.getOtpExpiry().isAfter(LocalDateTime.now())) {
                // Mevcut OTP kodunu kullan
                String otp = user.getOtpCode();
                
                // Chat ID'yi güncelle
                user.setTelegramChatId(chatId);
                userRepository.save(user);
                
                response.setText("✅ Hoş geldiniz!\n\n" +
                               "Uygulamaya giriş kodunuz: " + otp + "\n\n" +
                               "Bu kod 3 dakika geçerlidir.\n\n" +
                               "Kodu mobil uygulamaya girerek kaydınızı tamamlayabilirsiniz.");
                
                log.info("Existing OTP code sent to user: {} (phone: {})", user.getFullName(), normalizedPhone);
            } else {
                // Yeni OTP kodu üret
                String otp = generateOTP();
                
                // Veritabanını güncelle
                user.setTelegramChatId(chatId);
                user.setOtpCode(otp);
                user.setOtpExpiry(LocalDateTime.now().plusMinutes(3));
                user.setOtpVerified(false);
                userRepository.save(user);
                
                response.setText("✅ Hoş geldiniz!\n\n" +
                               "Uygulamaya giriş kodunuz: " + otp + "\n\n" +
                               "Bu kod 3 dakika geçerlidir.\n\n" +
                               "Kodu mobil uygulamaya girerek kaydınızı tamamlayabilirsiniz.");
                
                log.info("New OTP code generated and sent to user: {} (phone: {})", user.getFullName(), normalizedPhone);
            }
        } else {
            response.setText("❌ Hata: Bu telefon numarası site yönetimi tarafından sisteme eklenmemiş.\n\n" +
                           "Lütfen site yöneticinizle iletişime geçin.");
            
            log.warn("Phone number not found in system: {}", normalizedPhone);
        }

        try {
            execute(response);
        } catch (TelegramApiException e) {
            log.error("Error sending automatic OTP", e);
        }
    }

    /**
     * Kullanıcıdan telefon numarasını istemek için buton gönderir
     */
    private void sendPhoneRequestButton(Long chatId) {
        SendMessage response = new SendMessage();
        response.setChatId(chatId.toString());
        response.setText("Hoş geldiniz! Site Yönetim Sistemi'ne kayıt olmak için lütfen telefon numaranızı paylaşın.");

        // Telefon numarası paylaşma butonu
        ReplyKeyboardMarkup keyboardMarkup = new ReplyKeyboardMarkup();
        List<KeyboardRow> keyboard = new ArrayList<>();
        
        KeyboardRow row = new KeyboardRow();
        KeyboardButton button = new KeyboardButton("📱 Numaramı Paylaş");
        button.setRequestContact(true);
        row.add(button);
        
        keyboard.add(row);
        keyboardMarkup.setKeyboard(keyboard);
        keyboardMarkup.setResizeKeyboard(true);
        keyboardMarkup.setOneTimeKeyboard(true);
        
        response.setReplyMarkup(keyboardMarkup);

        try {
            execute(response);
            log.info("Phone request button sent to chatId: {}", chatId);
        } catch (TelegramApiException e) {
            log.error("Error sending phone request button", e);
        }
    }

    /**
     * Telefon numarasını doğrular ve OTP kodu gönderir
     */
    private void verifyPhoneAndSendCode(Long chatId, String phoneNumber) {
        // Telefon numarasını normalize et (başındaki +90, 90, 0 gibi prefiksleri temizle)
        String normalizedPhone = normalizePhoneNumber(phoneNumber);
        
        log.info("Verifying phone number: {} (normalized: {}) for chatId: {}", phoneNumber, normalizedPhone, chatId);

        // Veritabanında bu telefon numarasını ara
        Optional<User> userOpt = userRepository.findByPhone(normalizedPhone);
        
        SendMessage response = new SendMessage();
        response.setChatId(chatId.toString());

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            
            // 6 haneli OTP kodu üret
            String otp = generateOTP();
            
            // Veritabanını güncelle
            user.setTelegramChatId(chatId);
            user.setOtpCode(otp);
            user.setOtpExpiry(LocalDateTime.now().plusMinutes(3)); // 3 dakika geçerli
            user.setOtpVerified(false);
            userRepository.save(user);
            
            response.setText("✅ Doğrulama başarılı!\n\n" +
                           "Uygulamaya giriş kodunuz: " + otp + "\n\n" +
                           "Bu kod 3 dakika geçerlidir.");
            
            log.info("OTP code generated and sent to user: {} (phone: {})", user.getFullName(), normalizedPhone);
        } else {
            response.setText("❌ Hata: Bu telefon numarası site yönetimi tarafından sisteme eklenmemiş.\n\n" +
                           "Lütfen site yöneticinizle iletişime geçin.");
            
            log.warn("Phone number not found in system: {}", normalizedPhone);
        }

        try {
            execute(response);
        } catch (TelegramApiException e) {
            log.error("Error sending verification response", e);
        }
    }

    /**
     * Telefon numarasını normalize eder
     * +905551234567 -> 5551234567
     * 905551234567 -> 5551234567
     * 05551234567 -> 5551234567
     */
    private String normalizePhoneNumber(String phone) {
        if (phone == null) return null;
        
        // Tüm boşlukları ve özel karakterleri temizle
        String cleaned = phone.replaceAll("[^0-9]", "");
        
        // Başındaki +90, 90, 0 prefikslerini temizle
        if (cleaned.startsWith("90")) {
            cleaned = cleaned.substring(2);
        }
        if (cleaned.startsWith("0")) {
            cleaned = cleaned.substring(1);
        }
        
        return cleaned;
    }

    /**
     * 6 haneli rastgele OTP kodu üretir
     */
    private String generateOTP() {
        int otp = (int) (Math.random() * 900000) + 100000;
        return String.valueOf(otp);
    }

    /**
     * Belirli bir chat ID'ye mesaj gönderir (manuel kullanım için)
     */
    public void sendMessage(Long chatId, String text) {
        SendMessage message = new SendMessage();
        message.setChatId(chatId.toString());
        message.setText(text);

        try {
            execute(message);
            log.info("Message sent to chatId: {}", chatId);
        } catch (TelegramApiException e) {
            log.error("Error sending message to chatId: {}", chatId, e);
        }
    }
}
