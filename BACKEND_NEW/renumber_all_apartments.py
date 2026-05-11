import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor(dictionary=True)

print("=" * 80)
print("DAİRE NUMARALARINI YENİDEN DÜZENLEME")
print("=" * 80)

# Blokları al
cursor.execute("SELECT id, name FROM blocks WHERE site_id = '1' AND is_deleted = 0 ORDER BY name")
blocks = cursor.fetchall()

print(f"\nMevcut bloklar: {len(blocks)}")
for block in blocks:
    print(f"  {block['name']}")

# Toplam daire sayısı
cursor.execute("""
    SELECT COUNT(*) as total 
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0
""")
total_apartments = cursor.fetchone()['total']
print(f"\nToplam daire sayısı: {total_apartments}")

# Her bloğa kaç daire düşecek
apartments_per_block = total_apartments // len(blocks)
remaining = total_apartments % len(blocks)

print(f"\nHedef dağılım:")
print(f"  Her blok: {apartments_per_block} daire")
print(f"  Kalan: {remaining} daire (ilk bloklara eklenecek)")

# Yeni numaralandırma planı
block_distribution = []
for i, block in enumerate(blocks):
    extra = 1 if i < remaining else 0
    count = apartments_per_block + extra
    block_distribution.append({
        'block': block,
        'count': count
    })
    print(f"  {block['name']}: {count} daire")

print(f"\n" + "=" * 80)
print("DAİRE NUMARALARINI GÜNCELLİYOR")
print("=" * 80)

# Önce TÜM dairelere benzersiz geçici numara ver
print("\n1. Adım: Tüm dairelere geçici numara veriliyor...")
cursor.execute("""
    SELECT id FROM apartments WHERE site_id = '1' AND is_deleted = 0
""")
all_apts = cursor.fetchall()
for i, apt in enumerate(all_apts):
    cursor.execute("""
        UPDATE apartments 
        SET unit_number = %s
        WHERE id = %s
    """, (f"TEMP_{i}", apt['id']))
conn.commit()
print(f"✓ {len(all_apts)} daireye geçici numara verildi")

# Şimdi blok blok gerçek numaraları ver
print("\n2. Adım: Gerçek numaralar veriliyor...")
current_number = 1

for dist in block_distribution:
    block = dist['block']
    target_count = dist['count']
    
    # Bu bloktaki mevcut daireleri al
    cursor.execute("""
        SELECT id, unit_number, owner_user_id, current_resident_id
        FROM apartments 
        WHERE site_id = '1' AND block_id = %s AND is_deleted = 0
        ORDER BY unit_number
    """, (block['id'],))
    
    apartments = cursor.fetchall()
    current_count = len(apartments)
    
    print(f"\n{block['name']}:")
    print(f"  Mevcut: {current_count} daire")
    print(f"  Hedef: {target_count} daire")
    
    if current_count > target_count:
        # Fazla daireleri sil
        excess = current_count - target_count
        print(f"  ⚠️ {excess} fazla daire silinecek")
        
        for i in range(excess):
            apt = apartments[-(i+1)]  # Sondan başla
            
            # Sakinleri sil
            if apt['owner_user_id']:
                cursor.execute("UPDATE users SET is_deleted = 1 WHERE id = %s", (apt['owner_user_id'],))
                cursor.execute("DELETE FROM user_site_memberships WHERE user_id = %s", (apt['owner_user_id'],))
            
            if apt['current_resident_id']:
                cursor.execute("UPDATE users SET is_deleted = 1 WHERE id = %s", (apt['current_resident_id'],))
                cursor.execute("DELETE FROM user_site_memberships WHERE user_id = %s", (apt['current_resident_id'],))
            
            # Daireyi sil
            cursor.execute("DELETE FROM apartments WHERE id = %s", (apt['id'],))
            print(f"    ✓ Daire {apt['unit_number']} silindi")
        
        # Kalan daireleri yeniden al
        cursor.execute("""
            SELECT id, unit_number
            FROM apartments 
            WHERE site_id = '1' AND block_id = %s AND is_deleted = 0
            ORDER BY unit_number
        """, (block['id'],))
        apartments = cursor.fetchall()
    
    elif current_count < target_count:
        # Eksik daireler için yeni daireler oluştur
        shortage = target_count - current_count
        print(f"  ⚠️ {shortage} yeni daire oluşturulacak")
        
        import uuid
        import random
        
        first_names = ['Ahmet', 'Mehmet', 'Ayşe', 'Fatma', 'Ali', 'Veli', 'Zeynep', 'Elif', 'Mustafa', 'Hasan']
        last_names = ['Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Yıldız', 'Yıldırım', 'Öztürk', 'Aydın', 'Özdemir']
        
        for i in range(shortage):
            apartment_id = str(uuid.uuid4())
            temp_number = f"NEW_TEMP_{uuid.uuid4().hex[:8]}"  # Benzersiz geçici numara
            
            # Malik oluştur
            owner_id = str(uuid.uuid4())
            owner_name = f"{random.choice(first_names)} {random.choice(last_names)}"
            owner_phone = f"05{random.randint(10, 99)}{random.randint(100, 999)}{random.randint(1000, 9999)}"
            owner_email = f"{owner_name.lower().replace(' ', '.')}@example.com"
            
            cursor.execute("""
                INSERT INTO users (id, full_name, phone, email, password_hash, is_deleted)
                VALUES (%s, %s, %s, %s, %s, 0)
            """, (owner_id, owner_name, owner_phone, owner_email, '$2a$10$dummyhashedpassword'))
            
            membership_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO user_site_memberships (id, user_id, site_id, role_type, user_type, status, joined_at)
                VALUES (%s, %s, '1', 'RESIDENT', 'kat_maliki', 'aktif', CURDATE())
            """, (membership_id, owner_id))
            
            cursor.execute("""
                INSERT INTO apartments (
                    id, block_id, unit_number, floor, unit_type, area, 
                    bedrooms, bathrooms, owner_user_id, status, 
                    created_at, updated_at, is_deleted, block_name, site_id
                )
                VALUES (%s, %s, %s, 1, '3+1', 120.00, 3, 2, %s, 'dolu', NOW(), NOW(), 0, %s, '1')
            """, (apartment_id, block['id'], temp_number, owner_id, block['name']))
            
            print(f"    ✓ Yeni daire oluşturuldu: {owner_name}")
        
        # Tüm daireleri yeniden al
        cursor.execute("""
            SELECT id, unit_number
            FROM apartments 
            WHERE site_id = '1' AND block_id = %s AND is_deleted = 0
            ORDER BY unit_number
        """, (block['id'],))
        apartments = cursor.fetchall()
    
    # Daire numaralarını güncelle
    print(f"  Numaralandırma: {current_number} - {current_number + len(apartments) - 1}")
    
    for i, apt in enumerate(apartments):
        new_number = str(current_number + i)
        cursor.execute("""
            UPDATE apartments 
            SET unit_number = %s
            WHERE id = %s
        """, (new_number, apt['id']))
    
    current_number += len(apartments)

conn.commit()

# Son durumu göster
print(f"\n" + "=" * 80)
print("SON DURUM")
print("=" * 80)

cursor.execute("""
    SELECT COUNT(*) as total 
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0
""")
final_total = cursor.fetchone()['total']
print(f"Toplam daire sayısı: {final_total}")

for block in blocks:
    cursor.execute("""
        SELECT COUNT(*) as count,
               MIN(CAST(unit_number AS UNSIGNED)) as min_num,
               MAX(CAST(unit_number AS UNSIGNED)) as max_num
        FROM apartments 
        WHERE block_id = %s AND is_deleted = 0
    """, (block['id'],))
    result = cursor.fetchone()
    print(f"  {block['name']}: {result['count']} daire (Numara: {result['min_num']}-{result['max_num']})")

# Duplicate kontrol
cursor.execute("""
    SELECT unit_number, COUNT(*) as count
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0
    GROUP BY unit_number
    HAVING COUNT(*) > 1
""")
duplicates = cursor.fetchall()

if duplicates:
    print(f"\n⚠️ Hala duplicate var:")
    for dup in duplicates:
        print(f"  Daire {dup['unit_number']}: {dup['count']} kez")
else:
    print(f"\n✓ Tüm daire numaraları benzersiz!")

print("=" * 80)

cursor.close()
conn.close()
