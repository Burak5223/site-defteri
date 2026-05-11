import mysql.connector
import uuid
import random

# Türkçe isimler
first_names = ['Ahmet', 'Mehmet', 'Ayşe', 'Fatma', 'Ali', 'Veli', 'Zeynep', 'Elif', 'Mustafa', 'Hasan']
last_names = ['Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Yıldız', 'Yıldırım', 'Öztürk', 'Aydın', 'Özdemir']

def generate_name():
    return f"{random.choice(first_names)} {random.choice(last_names)}"

def generate_phone():
    return f"05{random.randint(10, 99)}{random.randint(100, 999)}{random.randint(1000, 9999)}"

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor(dictionary=True)

print("=" * 80)
print("5 YENİ DAİRE EKLENİYOR")
print("=" * 80)

# Blokları al
cursor.execute("SELECT id, name FROM blocks WHERE site_id = '1' AND is_deleted = 0 ORDER BY name")
blocks = cursor.fetchall()

print(f"\nMevcut bloklar:")
for block in blocks:
    cursor.execute("""
        SELECT COUNT(*) as count 
        FROM apartments 
        WHERE block_id = %s AND is_deleted = 0
    """, (block['id'],))
    count = cursor.fetchone()['count']
    print(f"  {block['name']}: {count} daire")

# C Blok'a 5 daire ekle (en az dairesi olan blok)
c_block = [b for b in blocks if b['name'] == 'C Blok'][0]

# Mevcut en yüksek daire numarasını bul
cursor.execute("""
    SELECT MAX(CAST(unit_number AS UNSIGNED)) as max_number
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0
""")
max_number = cursor.fetchone()['max_number'] or 1100

print(f"\n" + "=" * 80)
print(f"C BLOK'A 5 YENİ DAİRE EKLENİYOR")
print("=" * 80)

new_apartments = []
for i in range(5):
    apartment_id = str(uuid.uuid4())
    unit_number = str(max_number + i + 1)
    floor = 12  # 12. kat
    
    # Malik oluştur
    owner_id = str(uuid.uuid4())
    owner_name = generate_name()
    owner_phone = generate_phone()
    owner_email = f"{owner_name.lower().replace(' ', '.')}@example.com"
    
    cursor.execute("""
        INSERT INTO users (id, full_name, phone, email, password_hash, is_deleted)
        VALUES (%s, %s, %s, %s, %s, 0)
    """, (owner_id, owner_name, owner_phone, owner_email, '$2a$10$dummyhashedpassword'))
    
    # Site üyeliği ekle
    membership_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO user_site_memberships (id, user_id, site_id, role_type, user_type, status, joined_at)
        VALUES (%s, %s, '1', 'RESIDENT', 'kat_maliki', 'aktif', CURDATE())
    """, (membership_id, owner_id))
    
    # Daire oluştur
    cursor.execute("""
        INSERT INTO apartments (
            id, block_id, unit_number, floor, unit_type, area, 
            bedrooms, bathrooms, owner_user_id, status, 
            created_at, updated_at, is_deleted, block_name, site_id
        )
        VALUES (%s, %s, %s, %s, '3+1', 120.00, 3, 2, %s, 'dolu', NOW(), NOW(), 0, 'C Blok', '1')
    """, (apartment_id, c_block['id'], unit_number, floor, owner_id))
    
    new_apartments.append({
        'number': unit_number,
        'owner': owner_name
    })
    
    print(f"✓ C Blok - Daire {unit_number}: {owner_name} (Malik)")

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
total = cursor.fetchone()['total']
print(f"Toplam daire sayısı: {total}")

for block in blocks:
    cursor.execute("""
        SELECT COUNT(*) as count 
        FROM apartments 
        WHERE block_id = %s AND is_deleted = 0
    """, (block['id'],))
    count = cursor.fetchone()['count']
    print(f"  {block['name']}: {count} daire")

print(f"\n✓ 5 yeni daire eklendi!")
print(f"✓ Toplam daire sayısı: {total}")
print("=" * 80)

cursor.close()
conn.close()
