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
print("DAİRE NUMARALARINI YENİDEN DÜZENLEME")
print("=" * 80)

# Unique constraint'i geçici olarak kaldır
print("\n1. Unique constraint kaldırılıyor...")
try:
    cursor.execute("ALTER TABLE apartments DROP INDEX unique_unit_per_block")
    print("✓ Constraint kaldırıldı")
except:
    print("✓ Constraint zaten yok")

conn.commit()

# Blokları al
cursor.execute("SELECT id, name FROM blocks WHERE site_id = '1' AND is_deleted = 0 ORDER BY name")
blocks = cursor.fetchall()

# Toplam daire sayısı
cursor.execute("SELECT COUNT(*) as total FROM apartments WHERE site_id = '1' AND is_deleted = 0")
total_apartments = cursor.fetchone()['total']

print(f"\nToplam daire: {total_apartments}")
print(f"Blok sayısı: {len(blocks)}")

# Her bloğa 34 daire
apartments_per_block = 34

print(f"\n2. Daire dağılımı ayarlanıyor...")
first_names = ['Ahmet', 'Mehmet', 'Ayşe', 'Fatma', 'Ali', 'Veli', 'Zeynep', 'Elif', 'Mustafa', 'Hasan']
last_names = ['Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Yıldız', 'Yıldırım', 'Öztürk', 'Aydın', 'Özdemir']

for block in blocks:
    cursor.execute("""
        SELECT COUNT(*) as count 
        FROM apartments 
        WHERE site_id = '1' AND block_id = %s AND is_deleted = 0
    """, (block['id'],))
    current_count = cursor.fetchone()['count']
    
    if current_count > apartments_per_block:
        # Fazla daireleri sil
        excess = current_count - apartments_per_block
        cursor.execute("""
            SELECT id, owner_user_id, current_resident_id
            FROM apartments 
            WHERE site_id = '1' AND block_id = %s AND is_deleted = 0
            ORDER BY unit_number DESC
            LIMIT %s
        """, (block['id'], excess))
        
        to_delete = cursor.fetchall()
        for apt in to_delete:
            if apt['owner_user_id']:
                cursor.execute("UPDATE users SET is_deleted = 1 WHERE id = %s", (apt['owner_user_id'],))
                cursor.execute("DELETE FROM user_site_memberships WHERE user_id = %s", (apt['owner_user_id'],))
            if apt['current_resident_id']:
                cursor.execute("UPDATE users SET is_deleted = 1 WHERE id = %s", (apt['current_resident_id'],))
                cursor.execute("DELETE FROM user_site_memberships WHERE user_id = %s", (apt['current_resident_id'],))
            cursor.execute("DELETE FROM apartments WHERE id = %s", (apt['id'],))
        
        print(f"  {block['name']}: {excess} daire silindi ({current_count} → {apartments_per_block})")
    
    elif current_count < apartments_per_block:
        # Yeni daireler ekle
        shortage = apartments_per_block - current_count
        
        for i in range(shortage):
            apartment_id = str(uuid.uuid4())
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
                VALUES (%s, %s, 'TEMP', 1, '3+1', 120.00, 3, 2, %s, 'dolu', NOW(), NOW(), 0, %s, '1')
            """, (apartment_id, block['id'], owner_id, block['name']))
        
        print(f"  {block['name']}: {shortage} daire eklendi ({current_count} → {apartments_per_block})")

conn.commit()

# Numaralandırma
print(f"\n3. Daire numaraları güncelleniyor...")

# Önce tüm dairelere benzersiz geçici numara ver
cursor.execute("SELECT id FROM apartments WHERE site_id = '1' AND is_deleted = 0")
all_apts = cursor.fetchall()
for apt in all_apts:
    temp_num = f"T_{uuid.uuid4().hex[:12]}"
    cursor.execute("UPDATE apartments SET unit_number = %s WHERE id = %s", (temp_num, apt['id']))
conn.commit()
print(f"  ✓ {len(all_apts)} daireye geçici numara verildi")

# Şimdi gerçek numaraları ver
current_number = 1

for block in blocks:
    cursor.execute("""
        SELECT id
        FROM apartments 
        WHERE site_id = '1' AND block_id = %s AND is_deleted = 0
        ORDER BY id
    """, (block['id'],))
    
    apartments = cursor.fetchall()
    
    for apt in apartments:
        cursor.execute("""
            UPDATE apartments 
            SET unit_number = %s
            WHERE id = %s
        """, (str(current_number), apt['id']))
        current_number += 1
    
    print(f"  {block['name']}: {len(apartments)} daire numaralandırıldı")

conn.commit()

# Son durum
print(f"\n" + "=" * 80)
print("SON DURUM")
print("=" * 80)

cursor.execute("SELECT COUNT(*) as total FROM apartments WHERE site_id = '1' AND is_deleted = 0")
final_total = cursor.fetchone()['total']
print(f"Toplam daire: {final_total}")

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
    print(f"\n⚠️ Duplicate var:")
    for dup in duplicates:
        print(f"  Daire {dup['unit_number']}: {dup['count']} kez")
else:
    print(f"\n✓ Tüm daire numaraları benzersiz!")

print("=" * 80)

cursor.close()
conn.close()
