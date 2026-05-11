import mysql.connector
import random

# Veritabanı bağlantısı
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

print("=== ADDING OWNERS TO ALL APARTMENTS ===\n")

# 1. Malik olmayan daireleri bul
cursor.execute("""
    SELECT 
        a.id,
        a.block_name,
        a.unit_number,
        a.floor,
        a.current_resident_id,
        u.full_name as tenant_name
    FROM apartments a
    JOIN blocks b ON a.block_id = b.id
    LEFT JOIN users u ON a.current_resident_id = u.id
    WHERE b.site_id = '1'
    AND a.block_name IS NOT NULL
    AND a.block_name != 'None'
    AND a.owner_user_id IS NULL
    AND a.current_resident_id IS NOT NULL
    ORDER BY a.block_name, a.unit_number
""")

apartments_without_owners = cursor.fetchall()
print(f"Found {len(apartments_without_owners)} apartments without owners\n")

if len(apartments_without_owners) == 0:
    print("✓ All apartments already have owners!")
    cursor.close()
    conn.close()
    exit(0)

# 2. Her daire için yeni bir malik kullanıcısı oluştur
turkish_first_names = [
    "Ahmet", "Mehmet", "Mustafa", "Ali", "Hüseyin", "Hasan", "İbrahim", "Yusuf", "Ömer", "Fatma",
    "Ayşe", "Emine", "Hatice", "Zeynep", "Elif", "Meryem", "Şeyma", "Rabia", "Büşra", "Sümeyye",
    "Can", "Cem", "Deniz", "Ege", "Berk", "Kaan", "Eren", "Mert", "Yiğit", "Barış",
    "Selin", "Defne", "Ece", "Gizem", "İrem", "Merve", "Naz", "Pınar", "Seda", "Tuğçe"
]

turkish_last_names = [
    "Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Yıldız", "Yıldırım", "Öztürk", "Aydın", "Özdemir",
    "Arslan", "Doğan", "Kılıç", "Aslan", "Çetin", "Kara", "Koç", "Kurt", "Özkan", "Şimşek",
    "Erdoğan", "Güneş", "Aksoy", "Avcı", "Türk", "Polat", "Şen", "Bulut", "Karaca", "Özer"
]

added_count = 0
for apt in apartments_without_owners:
    apt_id, block_name, unit_number, floor, tenant_id, tenant_name = apt
    
    # Rastgele isim oluştur
    first_name = random.choice(turkish_first_names)
    last_name = random.choice(turkish_last_names)
    full_name = f"{first_name} {last_name}"
    
    # Email oluştur
    email = f"{first_name.lower()}.{last_name.lower()}.malik{unit_number}@yesilvadi.com"
    
    # Telefon numarası oluştur
    phone = f"+905{random.randint(300000000, 599999999)}"
    
    # Yeni kullanıcı ID'si oluştur
    import uuid
    user_id = str(uuid.uuid4())
    
    # Kullanıcıyı oluştur
    cursor.execute("""
        INSERT INTO users (id, full_name, email, phone, password_hash, created_at, updated_at)
        VALUES (%s, %s, %s, %s, '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhkO', NOW(), NOW())
    """, (user_id, full_name, email, phone))
    
    # user_site_memberships'e ekle
    membership_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO user_site_memberships 
        (id, user_id, site_id, role_type, status, is_deleted, created_at, updated_at)
        VALUES (%s, %s, '1', 'sakin', 'aktif', 0, NOW(), NOW())
    """, (membership_id, user_id))
    
    # Dairenin owner_user_id'sini güncelle
    cursor.execute("""
        UPDATE apartments 
        SET owner_user_id = %s
        WHERE id = %s
    """, (user_id, apt_id))
    
    conn.commit()
    added_count += 1
    
    print(f"✓ Added owner: {full_name}")
    print(f"  → {block_name} - {unit_number} (Floor {floor})")
    print(f"  → Tenant: {tenant_name}")
    print()

print(f"\n=== SUMMARY ===")
print(f"Total owners added: {added_count}")

# 3. Final verification
cursor.execute("""
    SELECT 
        a.block_name,
        COUNT(DISTINCT a.current_resident_id) as tenants,
        COUNT(DISTINCT a.owner_user_id) as owners
    FROM apartments a
    JOIN blocks b ON a.block_id = b.id
    WHERE b.site_id = '1'
    AND a.block_name IS NOT NULL
    AND a.block_name != 'None'
    GROUP BY a.block_name
    ORDER BY a.block_name
""")

distribution = cursor.fetchall()

print("\n=== DISTRIBUTION BY BLOCK ===")
total_tenants = 0
total_owners = 0
for block_name, tenants, owners in distribution:
    print(f"{block_name}: {tenants} tenants, {owners} owners")
    total_tenants += tenants
    total_owners += owners

print(f"\nTotal: {total_tenants} tenants, {total_owners} owners")

# 4. Toplam sakin sayısı
cursor.execute("""
    SELECT COUNT(DISTINCT user_id) FROM (
        SELECT current_resident_id as user_id
        FROM apartments a
        JOIN blocks b ON a.block_id = b.id
        WHERE b.site_id = '1'
        AND a.current_resident_id IS NOT NULL
        UNION
        SELECT owner_user_id as user_id
        FROM apartments a
        JOIN blocks b ON a.block_id = b.id
        WHERE b.site_id = '1'
        AND a.owner_user_id IS NOT NULL
    ) as all_users
""")

total_unique_residents = cursor.fetchone()[0]
print(f"\nTotal unique residents: {total_unique_residents}")

cursor.close()
conn.close()

print("\n=== DONE ===")
