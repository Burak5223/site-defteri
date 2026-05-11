import mysql.connector
import uuid
import random

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor(dictionary=True)

print("=" * 80)
print("TAMAMEN TEMİZLE VE YENİDEN OLUŞTUR")
print("=" * 80)

# 1. TÜM DAİRELERİ VE SAKİNLERİ SİL
print("\n1. Mevcut veriler temizleniyor...")

# Geçici olarak foreign key kontrollerini kapat
cursor.execute("SET FOREIGN_KEY_CHECKS = 0")

# Apartmanları sil
cursor.execute("DELETE FROM apartments WHERE site_id = '1'")

# Site üyeliklerini sil
cursor.execute("DELETE FROM user_site_memberships WHERE site_id = '1'")

# Site yöneticisi olmayan kullanıcıları sil
cursor.execute("""
    DELETE FROM users 
    WHERE site_id = '1' 
    AND id NOT IN (SELECT DISTINCT created_by FROM sites WHERE id = '1')
""")

# Foreign key kontrollerini tekrar aç
cursor.execute("SET FOREIGN_KEY_CHECKS = 1")

conn.commit()
print("✓ Temizlendi")

# 2. BLOKLARI KONTROL ET
print("\n2. Bloklar kontrol ediliyor...")
cursor.execute("SELECT id, name FROM blocks WHERE site_id = '1' AND is_deleted = 0 ORDER BY name")
blocks = cursor.fetchall()
print(f"✓ {len(blocks)} blok bulundu: {', '.join([b['name'] for b in blocks])}")

# 3. 102 DAİRE OLUŞTUR (Her blokta 34 daire)
print("\n3. 102 daire oluşturuluyor...")

first_names = ['Ahmet', 'Mehmet', 'Ayşe', 'Fatma', 'Ali', 'Veli', 'Zeynep', 'Elif', 'Mustafa', 'Hasan', 
               'Hüseyin', 'İbrahim', 'Ömer', 'Osman', 'Emine', 'Hatice', 'Meryem', 'Rabia', 'Selin', 'Deniz']
last_names = ['Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Yıldız', 'Yıldırım', 'Öztürk', 'Aydın', 'Özdemir',
              'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Kara', 'Koç', 'Kurt', 'Özkan', 'Şimşek']

def create_user(is_owner=True):
    user_id = str(uuid.uuid4())
    full_name = f"{random.choice(first_names)} {random.choice(last_names)}"
    phone = f"05{random.randint(10, 99)}{random.randint(100, 999)}{random.randint(1000, 9999)}"
    # Email'e UUID ekleyerek benzersiz yap
    email = f"{full_name.lower().replace(' ', '.')}.{user_id[:8]}@example.com"
    
    cursor.execute("""
        INSERT INTO users (id, full_name, phone, email, password_hash, site_id, is_deleted)
        VALUES (%s, %s, %s, %s, %s, '1', 0)
    """, (user_id, full_name, phone, email, '$2a$10$dummyhashedpassword'))
    
    membership_id = str(uuid.uuid4())
    user_type = 'kat_maliki' if is_owner else 'kiraci'
    cursor.execute("""
        INSERT INTO user_site_memberships (id, user_id, site_id, role_type, user_type, status, joined_at)
        VALUES (%s, %s, '1', 'RESIDENT', %s, 'aktif', CURDATE())
    """, (membership_id, user_id, user_type))
    
    return user_id, full_name

apartment_number = 1
apartments_per_block = 34

for block in blocks:
    print(f"\n  {block['name']}:")
    
    for i in range(apartments_per_block):
        # Her daireye malik oluştur
        owner_id, owner_name = create_user(is_owner=True)
        
        # %35 dairede kiracı da olsun
        tenant_id = None
        if random.random() < 0.35:
            tenant_id, tenant_name = create_user(is_owner=False)
        
        # Daire oluştur
        apartment_id = str(uuid.uuid4())
        floor = (i // 3) + 1  # Her 3 dairede bir kat
        
        cursor.execute("""
            INSERT INTO apartments (
                id, block_id, unit_number, floor, unit_type, area, 
                bedrooms, bathrooms, owner_user_id, current_resident_id,
                status, created_at, updated_at, is_deleted, block_name, site_id
            )
            VALUES (%s, %s, %s, %s, '3+1', 120.00, 3, 2, %s, %s, 'dolu', NOW(), NOW(), 0, %s, '1')
        """, (apartment_id, block['id'], str(apartment_number), floor, owner_id, tenant_id, block['name']))
        
        if i < 3:  # İlk 3 daireyi göster
            tenant_info = f" + {tenant_name} (Kiracı)" if tenant_id else ""
            print(f"    Daire {apartment_number}: {owner_name} (Malik){tenant_info}")
        
        apartment_number += 1
    
    print(f"    ... toplam {apartments_per_block} daire")

conn.commit()

# 4. KONTROL
print("\n" + "=" * 80)
print("KONTROL")
print("=" * 80)

cursor.execute("SELECT COUNT(*) as total FROM apartments WHERE site_id = '1' AND is_deleted = 0")
total = cursor.fetchone()['total']
print(f"Toplam daire: {total}")

cursor.execute("""
    SELECT unit_number, COUNT(*) as count
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0
    GROUP BY unit_number
    HAVING COUNT(*) > 1
""")
duplicates = cursor.fetchall()
print(f"Duplicate numara: {len(duplicates)}")

cursor.execute("""
    SELECT COUNT(*) as count 
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0 
    AND (owner_user_id IS NULL OR owner_user_id = '')
""")
without_owner = cursor.fetchone()['count']
print(f"Sahibi olmayan daire: {without_owner}")

cursor.execute("""
    SELECT COUNT(*) as count 
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0 
    AND owner_user_id IS NOT NULL AND owner_user_id != ''
""")
with_owner = cursor.fetchone()['count']

cursor.execute("""
    SELECT COUNT(*) as count 
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0 
    AND current_resident_id IS NOT NULL AND current_resident_id != ''
""")
with_tenant = cursor.fetchone()['count']

print(f"Malik olan daire: {with_owner}")
print(f"Kiracı olan daire: {with_tenant}")

for block in blocks:
    cursor.execute("""
        SELECT COUNT(*) as count,
               MIN(CAST(unit_number AS UNSIGNED)) as min_num,
               MAX(CAST(unit_number AS UNSIGNED)) as max_num
        FROM apartments 
        WHERE block_id = %s AND is_deleted = 0
    """, (block['id'],))
    result = cursor.fetchone()
    print(f"{block['name']}: {result['count']} daire (Numara: {result['min_num']}-{result['max_num']})")

cursor.execute("""
    SELECT COUNT(DISTINCT user_id) as count
    FROM (
        SELECT owner_user_id as user_id FROM apartments WHERE site_id = '1' AND is_deleted = 0 AND owner_user_id IS NOT NULL
        UNION
        SELECT current_resident_id as user_id FROM apartments WHERE site_id = '1' AND is_deleted = 0 AND current_resident_id IS NOT NULL
    ) as all_residents
""")
total_residents = cursor.fetchone()['count']
print(f"\nToplam benzersiz sakin: {total_residents}")

print("\n" + "=" * 80)
if total == 102 and len(duplicates) == 0 and without_owner == 0:
    print("✓ HER ŞEY TAMAM!")
else:
    print("⚠️ SORUN VAR!")
print("=" * 80)

cursor.close()
conn.close()
