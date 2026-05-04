import mysql.connector
from datetime import datetime, timedelta
import random

# Database bağlantısı
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

# Yeni OTP kodu üret
otp_code = str(random.randint(100000, 999999))
otp_expiry = datetime.now() + timedelta(minutes=3)

# Kullanıcıyı güncelle
cursor.execute("""
    UPDATE users 
    SET otp_code = %s, 
        otp_expiry = %s,
        otp_verified = 0
    WHERE phone = '5539304912'
""", (otp_code, otp_expiry))

conn.commit()

# Kullanıcı bilgilerini al
cursor.execute("""
    SELECT id, full_name, phone, telegram_chat_id, otp_code, otp_expiry
    FROM users
    WHERE phone = '5539304912'
""")

user = cursor.fetchone()

print("=" * 60)
print("TELEGRAM OTP KODU OLUŞTURULDU")
print("=" * 60)
print(f"Kullanıcı: {user[1]}")
print(f"Telefon: {user[2]}")
print(f"OTP Kodu: {user[4]}")
print(f"Geçerlilik: {user[5]}")
print(f"Telegram Chat ID: {user[3] if user[3] else 'YOK (Bot başlatılmamış)'}")
print("=" * 60)
print()
print("ŞİMDİ NE YAPACAKSIN:")
print()
print("1. Telegram'ı aç")
print("2. Arama kutusuna '@sakin_onay_bot' yaz")
print("3. Botu aç")
print("4. Aşağıda 'START' veya 'BOT'U BAŞLAT' butonu göreceksin")
print("5. O butona BAS")
print()
print("Bot sana otomatik olarak OTP kodunu gönderecek!")
print()
print("Eğer START butonu görmüyorsan:")
print("- Chat kutusuna '/start' yaz ve gönder")
print()
print("=" * 60)

cursor.close()
conn.close()
