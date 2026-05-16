#!/usr/bin/env python3
"""
Test görevleri oluşturma scripti
Güvenlik ve temizlik personeline görevler atar
"""

import mysql.connector
from datetime import datetime, timedelta
import random
import uuid

# Veritabanı bağlantısı
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor()

print("=" * 80)
print("TEST GÖREVLERİ OLUŞTURMA")
print("=" * 80)

# 1. Güvenlik ve temizlik kullanıcılarını bul
print("\n1. Güvenlik ve temizlik kullanıcıları bulunuyor...")

# Güvenlik kullanıcıları
cursor.execute("""
    SELECT DISTINCT u.id, u.full_name 
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE r.name = 'SECURITY' AND u.site_id = '1' AND u.is_deleted = 0
    LIMIT 3
""")
security_users = cursor.fetchall()
print(f"✓ {len(security_users)} güvenlik kullanıcısı bulundu")
for user_id, name in security_users:
    print(f"  - {name} ({user_id})")

# Temizlik kullanıcıları
cursor.execute("""
    SELECT DISTINCT u.id, u.full_name 
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE r.name = 'CLEANING' AND u.site_id = '1' AND u.is_deleted = 0
    LIMIT 3
""")
cleaning_users = cursor.fetchall()
print(f"✓ {len(cleaning_users)} temizlik kullanıcısı bulundu")
for user_id, name in cleaning_users:
    print(f"  - {name} ({user_id})")

if not security_users and not cleaning_users:
    print("\n⚠ Güvenlik veya temizlik kullanıcısı bulunamadı!")
    print("Önce güvenlik ve temizlik kullanıcıları oluşturulmalı.")
    cursor.close()
    conn.close()
    exit(1)

# 2. Eski görevleri temizle
print("\n2. Eski görevler temizleniyor...")
cursor.execute("DELETE FROM tasks WHERE site_id = '1'")
conn.commit()
print("✓ Eski görevler temizlendi")

# 3. Güvenlik görevleri oluştur
print("\n3. Güvenlik görevleri oluşturuluyor...")

security_tasks = [
    ("Gece Nöbeti", "23:00-07:00 arası gece nöbet görevi", "Güvenlik", "devam_ediyor", 0),
    ("Kamera Kontrolü", "Güvenlik kameralarının kontrolü ve kayıtların incelenmesi", "Güvenlik", "tamamlandi", -1),
    ("Araç Giriş Kontrolü", "Gelen araçların plaka kaydı ve kontrol", "Güvenlik", "devam_ediyor", 0),
    ("Devriye", "Site içi güvenlik devriyesi", "Güvenlik", "tamamlandi", -2),
    ("Kapı Kontrolü", "Ana giriş kapısında kimlik kontrolü", "Güvenlik", "devam_ediyor", 0),
    ("Acil Durum Tatbikatı", "Yangın ve deprem tatbikatı hazırlığı", "Güvenlik", "bekliyor", 2),
    ("Ziyaretçi Kayıt", "Gelen ziyaretçilerin kayıt işlemleri", "Güvenlik", "devam_ediyor", 0),
    ("Otopark Denetimi", "Otopark alanı güvenlik denetimi", "Güvenlik", "tamamlandi", -3),
]

task_count = 0
for title, description, task_type, status, days_offset in security_tasks:
    if security_users:
        assigned_to = random.choice(security_users)[0]
        due_date = datetime.now() + timedelta(days=days_offset + 1)
        created_date = datetime.now() + timedelta(days=days_offset)
        task_id = str(uuid.uuid4())
        
        cursor.execute("""
            INSERT INTO tasks (id, site_id, title, description, assigned_to, task_type, due_date, 
                             status, created_at, is_deleted)
            VALUES (%s, '1', %s, %s, %s, %s, %s, %s, %s, 0)
        """, (task_id, title, description, assigned_to, task_type, due_date, status, created_date))
        task_count += 1

conn.commit()
print(f"✓ {task_count} güvenlik görevi oluşturuldu")

# 4. Temizlik görevleri oluştur
print("\n4. Temizlik görevleri oluşturuluyor...")

cleaning_tasks = [
    ("Ortak Alan Temizliği", "Lobiler ve koridorların genel temizliği", "Temizlik", "tamamlandi", -1),
    ("Merdiven Temizliği", "Tüm blokların merdiven temizliği", "Temizlik", "devam_ediyor", 0),
    ("Bahçe Düzenlemesi", "Bahçe ve yeşil alanların bakımı", "Temizlik", "tamamlandi", -2),
    ("Çöp Toplama", "Günlük çöp toplama ve konteyner temizliği", "Temizlik", "devam_ediyor", 0),
    ("Cam Silme", "Giriş kapıları ve cam yüzeylerin temizliği", "Temizlik", "bekliyor", 1),
    ("Havuz Temizliği", "Yüzme havuzu temizlik ve bakımı", "Temizlik", "devam_ediyor", 0),
    ("Asansör Temizliği", "Tüm asansörlerin iç temizliği", "Temizlik", "tamamlandi", -1),
    ("Otopark Yıkama", "Otopark zemini yıkama işlemi", "Temizlik", "bekliyor", 3),
]

task_count = 0
for title, description, task_type, status, days_offset in cleaning_tasks:
    if cleaning_users:
        assigned_to = random.choice(cleaning_users)[0]
        due_date = datetime.now() + timedelta(days=days_offset + 1)
        created_date = datetime.now() + timedelta(days=days_offset)
        task_id = str(uuid.uuid4())
        
        cursor.execute("""
            INSERT INTO tasks (id, site_id, title, description, assigned_to, task_type, due_date, 
                             status, created_at, is_deleted)
        """, (task_id, title, description, assigned_to, task_type, due_date, status, created_date))
        task_count += 1

conn.commit()
print(f"✓ {task_count} temizlik görevi oluşturuldu")

# 5. Özet bilgileri göster
print("\n" + "=" * 80)
print("TEST GÖREVLERİ BAŞARIYLA OLUŞTURULDU!")
print("=" * 80)

cursor.execute("SELECT COUNT(*) FROM tasks WHERE site_id = '1'")
total_tasks = cursor.fetchone()[0]

cursor.execute("SELECT COUNT(*) FROM tasks WHERE site_id = '1' AND status = 'devam_ediyor'")
ongoing_tasks = cursor.fetchone()[0]

cursor.execute("SELECT COUNT(*) FROM tasks WHERE site_id = '1' AND status = 'tamamlandi'")
completed_tasks = cursor.fetchone()[0]

cursor.execute("SELECT COUNT(*) FROM tasks WHERE site_id = '1' AND status = 'bekliyor'")
pending_tasks = cursor.fetchone()[0]

print(f"\n📊 İSTATİSTİKLER:")
print(f"  • Toplam Görev: {total_tasks}")
print(f"  • Devam Eden: {ongoing_tasks}")
print(f"  • Tamamlanan: {completed_tasks}")
print(f"  • Bekleyen: {pending_tasks}")
print(f"  • Güvenlik Personeli: {len(security_users)}")
print(f"  • Temizlik Personeli: {len(cleaning_users)}")

print("\n✅ Görevler başarıyla oluşturuldu!")
print("=" * 80)

cursor.close()
conn.close()
