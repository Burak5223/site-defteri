#!/usr/bin/env python3
"""
Mevcut güvenlik ve temizlik kullanıcılarına görev atama scripti
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
print("MEVCUT KULLANICILARA GÖREV ATAMA")
print("=" * 80)

# 1. Güvenlik ve temizlik kullanıcılarını email ile bul
print("\n1. Kullanıcılar aranıyor...")

# Güvenlik kullanıcısı
cursor.execute("""
    SELECT id, full_name, email, site_id 
    FROM users 
    WHERE email = 'guvenlik@site.com' AND is_deleted = 0
""")
security_user = cursor.fetchone()

if security_user:
    print(f"✓ Güvenlik kullanıcısı bulundu: {security_user[1]} ({security_user[2]}) - Site: {security_user[3]}")
else:
    print("⚠ Güvenlik kullanıcısı bulunamadı!")

# Temizlik kullanıcısı
cursor.execute("""
    SELECT id, full_name, email, site_id 
    FROM users 
    WHERE email = 'temizlik@site.com' AND is_deleted = 0
""")
cleaning_user = cursor.fetchone()

if cleaning_user:
    print(f"✓ Temizlik kullanıcısı bulundu: {cleaning_user[1]} ({cleaning_user[2]}) - Site: {cleaning_user[3]}")
else:
    print("⚠ Temizlik kullanıcısı bulunamadı!")

if not security_user and not cleaning_user:
    print("\n❌ Hiçbir kullanıcı bulunamadı!")
    cursor.close()
    conn.close()
    exit(1)

# 2. Eski görevleri temizle
print("\n2. Eski görevler temizleniyor...")
if security_user:
    cursor.execute(f"DELETE FROM tasks WHERE assigned_to = '{security_user[0]}'")
if cleaning_user:
    cursor.execute(f"DELETE FROM tasks WHERE assigned_to = '{cleaning_user[0]}'")
conn.commit()
print("✓ Eski görevler temizlendi")

# 3. Güvenlik görevleri oluştur
if security_user:
    print(f"\n3. Güvenlik görevleri oluşturuluyor ({security_user[1]})...")
    
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
        due_date = datetime.now() + timedelta(days=days_offset + 1)
        created_date = datetime.now() + timedelta(days=days_offset)
        task_id = str(uuid.uuid4())
        
        cursor.execute("""
            INSERT INTO tasks (id, site_id, title, description, assigned_to, task_type, due_date, 
                             status, created_at, is_deleted)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 0)
        """, (task_id, security_user[3], title, description, security_user[0], task_type, due_date, status, created_date))
        task_count += 1
    
    conn.commit()
    print(f"✓ {task_count} güvenlik görevi oluşturuldu")

# 4. Temizlik görevleri oluştur
if cleaning_user:
    print(f"\n4. Temizlik görevleri oluşturuluyor ({cleaning_user[1]})...")
    
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
        due_date = datetime.now() + timedelta(days=days_offset + 1)
        created_date = datetime.now() + timedelta(days=days_offset)
        task_id = str(uuid.uuid4())
        
        cursor.execute("""
            INSERT INTO tasks (id, site_id, title, description, assigned_to, task_type, due_date, 
                             status, created_at, is_deleted)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 0)
        """, (task_id, cleaning_user[3], title, description, cleaning_user[0], task_type, due_date, status, created_date))
        task_count += 1
    
    conn.commit()
    print(f"✓ {task_count} temizlik görevi oluşturuldu")

# 5. Özet bilgileri göster
print("\n" + "=" * 80)
print("GÖREVLER BAŞARIYLA ATANDI!")
print("=" * 80)

if security_user:
    cursor.execute(f"SELECT COUNT(*) FROM tasks WHERE assigned_to = '{security_user[0]}'")
    security_task_count = cursor.fetchone()[0]
    print(f"\n✓ Güvenlik ({security_user[2]}): {security_task_count} görev")

if cleaning_user:
    cursor.execute(f"SELECT COUNT(*) FROM tasks WHERE assigned_to = '{cleaning_user[0]}'")
    cleaning_task_count = cursor.fetchone()[0]
    print(f"✓ Temizlik ({cleaning_user[2]}): {cleaning_task_count} görev")

print("\n📱 Kullanıcılar şimdi kendi hesaplarına giriş yaparak görevlerini görebilirler!")
print("=" * 80)

cursor.close()
conn.close()
