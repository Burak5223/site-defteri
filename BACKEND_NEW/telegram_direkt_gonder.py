#!/usr/bin/env python3
"""
Telegram'a direkt OTP kodu gönder - 5539304912
"""

import mysql.connector
import random
from datetime import datetime, timedelta
import requests

def send_telegram_direct():
    """Telegram'a direkt mesaj gönder"""
    
    print("=" * 60)
    print("TELEGRAM DİREKT MESAJ GÖNDERME")
    print("=" * 60)
    
    phone = "5539304912"
    telegram_bot_token = "8515377926:AAHlv_RCqEuKg_A-ULY7QLoC_zUfuvKKSmM"
    
    try:
        # 1. Database'den kullanıcıyı bul
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="Hilton5252.",
            database="smart_site_management"
        )
        
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, full_name, phone, telegram_chat_id
            FROM users
            WHERE phone = %s
        """, (phone,))
        
        user = cursor.fetchone()
        
        if not user:
            print(f"❌ Kullanıcı bulunamadı: {phone}")
            return
        
        print(f"\n✅ Kullanıcı: {user['full_name']}")
        print(f"   Telefon: {user['phone']}")
        print(f"   Chat ID: {user['telegram_chat_id']}")
        
        # 2. Yeni OTP kodu üret
        otp_code = str(random.randint(100000, 999999))
        otp_expiry = datetime.now() + timedelta(minutes=3)
        
        print(f"\n📱 Yeni OTP Kodu: {otp_code}")
        
        # 3. Database'e kaydet
        cursor.execute("""
            UPDATE users
            SET otp_code = %s,
                otp_expiry = %s,
                otp_verified = 0
            WHERE phone = %s
        """, (otp_code, otp_expiry, phone))
        
        conn.commit()
        print(f"✅ Database'e kaydedildi")
        
        # 4. Telegram'a gönder
        print(f"\n📤 Telegram'a gönderiliyor...")
        
        # Eğer chat_id varsa direkt gönder
        if user['telegram_chat_id']:
            chat_id = user['telegram_chat_id']
            
            message = f"""✅ Hoş geldiniz!

Uygulamaya giriş kodunuz: {otp_code}

Bu kod 3 dakika geçerlidir.

Kodu mobil uygulamaya girerek kaydınızı tamamlayabilirsiniz."""
            
            response = requests.post(
                f"https://api.telegram.org/bot{telegram_bot_token}/sendMessage",
                json={
                    "chat_id": chat_id,
                    "text": message
                }
            )
            
            if response.status_code == 200:
                print(f"✅ Telegram mesajı gönderildi!")
                print(f"   Chat ID: {chat_id}")
            else:
                print(f"❌ Telegram hatası: {response.text}")
        else:
            print(f"⚠️  Chat ID yok!")
            print(f"\n📱 Telegram bot'u başlatmak için:")
            print(f"   https://t.me/sakin_onay_bot?start=PHONE_{phone}")
            
            # Telegram bot'a getUpdates çağrısı yap
            print(f"\n🔍 Telegram güncellemelerini kontrol ediyorum...")
            
            response = requests.get(
                f"https://api.telegram.org/bot{telegram_bot_token}/getUpdates"
            )
            
            if response.status_code == 200:
                updates = response.json()
                
                if updates.get('result'):
                    print(f"\n📬 {len(updates['result'])} güncelleme bulundu:")
                    
                    for update in updates['result'][-5:]:  # Son 5 güncelleme
                        if 'message' in update:
                            msg = update['message']
                            chat_id = msg['chat']['id']
                            username = msg['chat'].get('username', 'N/A')
                            first_name = msg['chat'].get('first_name', 'N/A')
                            text = msg.get('text', 'N/A')
                            
                            print(f"\n   Chat ID: {chat_id}")
                            print(f"   İsim: {first_name}")
                            print(f"   Username: @{username}")
                            print(f"   Mesaj: {text}")
                            
                            # Bu chat ID'ye mesaj gönder
                            print(f"\n   📤 Bu chat ID'ye kod gönderiliyor...")
                            
                            response2 = requests.post(
                                f"https://api.telegram.org/bot{telegram_bot_token}/sendMessage",
                                json={
                                    "chat_id": chat_id,
                                    "text": f"✅ OTP Kodunuz: {otp_code}\n\nBu kod 3 dakika geçerlidir."
                                }
                            )
                            
                            if response2.status_code == 200:
                                print(f"   ✅ Mesaj gönderildi!")
                                
                                # Chat ID'yi database'e kaydet
                                cursor.execute("""
                                    UPDATE users
                                    SET telegram_chat_id = %s
                                    WHERE phone = %s
                                """, (chat_id, phone))
                                conn.commit()
                                print(f"   ✅ Chat ID database'e kaydedildi!")
                            else:
                                print(f"   ❌ Hata: {response2.text}")
                else:
                    print(f"⚠️  Hiç güncelleme yok")
                    print(f"\n💡 Telegram bot'u başlatman gerekiyor:")
                    print(f"   https://t.me/sakin_onay_bot?start=PHONE_{phone}")
        
        cursor.close()
        conn.close()
        
        print(f"\n" + "=" * 60)
        print("İŞLEM TAMAMLANDI")
        print("=" * 60)
        print(f"\n📱 OTP Kodu: {otp_code}")
        print(f"⏰ Geçerlilik: 3 dakika")
        print()
        
    except Exception as e:
        print(f"❌ Hata: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    send_telegram_direct()
