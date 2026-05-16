#!/usr/bin/env python3
"""
Temizlik kullanıcısı oluşturma scripti
"""

import mysql.connector
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
print("TEMİZLİK KULLANICISI OLUŞTURMA")
print("=" * 80)

# 1. CLEANING rolünü bul
cursor.execute("SELECT id FROM roles WHERE name = 'CLEANING'")
cleaning_role = cursor.fetchone()

if not cleaning_role:
    print("\n⚠ CLEANING rolü bulunamadı! Önce rol oluşturuluyor...")
    cleaning_role_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO roles (id, name, description, created_at)
        VALUES (%s, 'CLEANING', 'Temizlik Personeli', NOW())
    """, (cleaning_role_id,))
    conn.commit()
    print(f"✓ CLEANING rolü oluşturuldu: {cleaning_role_id}")
else:
    cleaning_role_id = cleaning_role[0]
    print(f"✓ CLEANING rolü bulundu: {cleaning_role_id}")

# 2. Temizlik kullanıcısı oluştur
print("\n2. Temizlik kullanıcısı oluşturuluyor...")

user_id = str(uuid.uuid4())
cursor.execute("""
    INSERT INTO users (id, site_id, full_name, email, phone, password_hash, 
                      created_at, is_deleted)
    VALUES (%s, '1', 'Temizlik User', 'temizlik@site.com', '+90 555 111 22 33', 
            '$2a$10$rN8qzXQqQqQqQqQqQqQqQeO8qzXQqQqQqQqQqQqQqQqQqQqQqQ', 
            NOW(), 0)
""", (user_id,))

# 3. Kullanıcıya CLEANING rolü ata
user_role_id = str(uuid.uuid4())
cursor.execute("""
    INSERT INTO user_roles (id, user_id, role_id, site_id, created_at, is_deleted)
    VALUES (%s, %s, %s, '1', NOW(), 0)
""", (user_role_id, user_id, cleaning_role_id))

conn.commit()

print(f"✓ Temizlik kullanıcısı oluşturuldu")
print(f"  - ID: {user_id}")
print(f"  - Ad: Temizlik User")
print(f"  - Email: temizlik@site.com")
print(f"  - Şifre: admin123")

print("\n✅ Temizlik kullanıcısı başarıyla oluşturuldu!")
print("=" * 80)

cursor.close()
conn.close()
