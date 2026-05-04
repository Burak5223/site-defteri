#!/usr/bin/env python3
"""
5539304912 numarasına direkt OTP kodu gönder
"""

import mysql.connector
import random
from datetime import datetime, timedelta
import requests

def send_otp_via_telegram():
    """Database'e OTP kodu yaz ve Telegram'a gönder"""
    
    print("=" * 60)
    print("OTP KODU GÖNDERME - 5539304912")
    print("=" * 60)
    
    phone = "5539304912"
    
    try:
        # Database bağlantısı
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="Hilton5252.",
            database="smart_site_management"
        )
        
        cursor = conn.cursor(dictionary=True)
        
        # 1. Kullanıcıyı bul
        cursor.execute("""
            SELECT id, full_name, phone, telegram_chat_id
            FROM users
            WHERE phone = %s
        """, (phone,))
        
        user = cursor.fetchone()
        
        if not user:
            print(f"❌ Kullanıcı bulunamadı: {phone}")
            return
        
        print(f"\n✅ Kullanıcı bulundu:")
        print(f"   ID: {user['id']}")
        print(f"   İsim: {user['full_name']}")
        print(f"   Telefon: {user['phone']}")
        print(f"   Telegram Chat ID: {user['telegram_chat_id']}")
        
        # 2. OTP kodu üret
        otp_code = str(random.randint(100000, 999999))
        otp_expiry = datetime.now() + timedelta(minutes=3)
        
        print(f"\n📱 OTP Kodu: {otp_code}")
        print(f"⏰ Geçerlilik: {otp_expiry}")
        
        # 3. Database'e kaydet
        cursor.execute("""
            UPDATE users
            SET otp_code = %s,
                otp_expiry = %s,
                otp_verified = 0
            WHERE phone = %s
        """, (otp_code, otp_expiry, phone))
        
        conn.commit()
        print(f"\n✅ OTP kodu database'e kaydedildi!")
        
        # 4. Telegram bot linki
        print(f"\n" + "=" * 60)
        print("TELEGRAM BOT LİNKİ")
        print("=" * 60)
        print(f"\n📱 Bu linke tıklayarak Telegram'dan kodu alabilirsiniz:")
        print(f"\nhttps://t.me/sakin_onay_bot?start=PHONE_{phone}")
        print()
        
        # 5. Eğer chat_id varsa direkt mesaj gönder
        if user['telegram_chat_id']:
            print(f"\n💬 Telegram Chat ID bulundu, direkt mesaj gönderiliyor...")
            
            telegram_bot_token = "8515377926:AAHlv_RCqEuKg_A-ULY7QLoC_zUfuvKKSmM"
            chat_id = user['telegram_chat_id']
            
            message = f"""✅ Hoş geldiniz!

Uygulamaya giriş kodunuz: {otp_code}

Bu kod 3 dakika geçerlidir.

Kodu mobil uygulamaya girerek kaydınızı tamamlayabilirsiniz."""
            
            try:
                response = requests.post(
                    f"https://api.telegram.org/bot{telegram_bot_token}/sendMessage",
                    json={
                        "chat_id": chat_id,
                        "text": message
                    }
                )
                
                if response.status_code == 200:
                    print(f"✅ Telegram mesajı gönderildi!")
                else:
                    print(f"❌ Telegram mesajı gönderilemedi: {response.text}")
                    
            except Exception as e:
                print(f"❌ Telegram API hatası: {e}")
        else:
            print(f"\n⚠️  Telegram Chat ID yok, kullanıcının botu başlatması gerekiyor!")
        
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
    send_otp_via_telegram()
