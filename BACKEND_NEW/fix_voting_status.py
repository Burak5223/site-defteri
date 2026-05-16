import mysql.connector
from datetime import datetime

# Veritabanı bağlantısı
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

print("🔍 Mevcut oylama status değerleri:")
cursor.execute("SELECT id, title, status, end_date FROM votings ORDER BY id")
votings = cursor.fetchall()

for voting in votings:
    voting_id, title, status, end_date = voting
    print(f"  ID: {voting_id}, Başlık: {title}, Status: '{status}', Bitiş: {end_date}")

print("\n🔧 Status değerleri düzeltiliyor...")

# Tüm status değerlerini normalize et
# "AKTIF", "aktif", "active" -> "active"
# "TAMAMLANDI", "tamamlandi", "completed", "closed" -> "completed"

cursor.execute("""
    UPDATE votings 
    SET status = 'active' 
    WHERE UPPER(status) IN ('AKTIF', 'ACTIVE')
""")
print(f"✅ {cursor.rowcount} oylama 'active' olarak güncellendi")

cursor.execute("""
    UPDATE votings 
    SET status = 'completed' 
    WHERE UPPER(status) IN ('TAMAMLANDI', 'COMPLETED', 'CLOSED', 'SONA ERDI')
""")
print(f"✅ {cursor.rowcount} oylama 'completed' olarak güncellendi")

# Bitiş tarihi geçmiş oylamaları otomatik olarak completed yap
cursor.execute("""
    UPDATE votings 
    SET status = 'completed' 
    WHERE end_date < NOW() AND status = 'active'
""")
print(f"✅ {cursor.rowcount} süresi dolmuş oylama 'completed' olarak güncellendi")

conn.commit()

print("\n✅ Güncellenmiş status değerleri:")
cursor.execute("SELECT id, title, status, end_date FROM votings ORDER BY id")
votings = cursor.fetchall()

for voting in votings:
    voting_id, title, status, end_date = voting
    is_expired = end_date < datetime.now() if end_date else False
    status_icon = "🟢" if status == "active" else "🔴"
    expired_text = " (SÜRESİ DOLMUŞ)" if is_expired else ""
    print(f"  {status_icon} ID: {voting_id}, Başlık: {title}, Status: '{status}'{expired_text}")

cursor.close()
conn.close()

print("\n✅ Tüm status değerleri normalize edildi!")
print("📱 Mobil uygulama artık doğru status değerlerini görecek")
