import mysql.connector
import uuid
import random

# Türkçe isimler
first_names = ['Ahmet', 'Mehmet', 'Ayşe', 'Fatma', 'Ali', 'Veli', 'Zeynep', 'Elif', 'Mustafa', 'Hasan', 'Hüseyin', 'İbrahim', 'Ömer', 'Osman', 'Emine', 'Hatice', 'Meryem', 'Rabia', 'Selin', 'Deniz']
last_names = ['Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Yıldız', 'Yıldırım', 'Öztürk', 'Aydın', 'Özdemir', 'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Kara', 'Koç', 'Kurt', 'Özkan', 'Şimşek']

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
print("TÜM DAİRELERE SAKİN ATAMA")
print("=" * 80)

# Mevcut durumu kontrol et
cursor.execute("""
    SELECT COUNT(*) as total 
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0
""")
total_apartments = cursor.fetchone()['total']
print(f"\nToplam daire sayısı: {total_apartments}")

# Sahibi olmayan daireler
cursor.execute("""
    SELECT COUNT(*) as count 
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0 
    AND (owner_user_id IS NULL OR owner_user_id = '')
""")
without_owner = cursor.fetchone()['count']
print(f"Sahibi olmayan daire sayısı: {without_owner}")

# Kiracısı olmayan daireler
cursor.execute("""
    SELECT COUNT(*) as count 
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0 
    AND (current_resident_id IS NULL OR current_resident_id = '')
""")
without_tenant = cursor.fetchone()['count']
print(f"Kiracısı olmayan daire sayısı: {without_tenant}")

# Mevcut sakin sayıları
cursor.execute("""
    SELECT COUNT(*) as count 
    FROM users u
    JOIN user_site_memberships usm ON u.id = usm.user_id
    WHERE usm.site_id = '1' AND u.is_deleted = 0
    AND (u.roles LIKE '%RESIDENT%' OR u.roles LIKE '%OWNER%' OR u.roles LIKE '%TENANT%')
""")
current_residents = cursor.fetchone()['count']
print(f"Mevcut sakin sayısı: {current_residents}")

# Hedef: Her daireye en az 1 malik
# %60 dairede kiracı da olsun
target_owners = total_apartments
target_tenants = int(total_apartments * 0.4)  # %40 dairede kiracı

print(f"\n" + "=" * 80)
print("HEDEF")
print("=" * 80)
print(f"Hedef malik sayısı: {target_owners}")
print(f"Hedef kiracı sayısı: {target_tenants}")
print(f"Toplam hedef sakin: {target_owners + target_tenants}")

# Yeni sakin oluşturma fonksiyonu
def create_resident(is_owner=True):
    user_id = str(uuid.uuid4())
    full_name = generate_name()
    phone = generate_phone()
    email = f"{full_name.lower().replace(' ', '.')}@example.com"
    
    # Kullanıcı oluştur
    cursor.execute("""
        INSERT INTO users (id, full_name, phone_number, email, password_hash, roles, is_deleted)
        VALUES (%s, %s, %s, %s, %s, %s, 0)
    """, (user_id, full_name, phone, email, '$2a$10$dummyhashedpassword', 'ROLE_RESIDENT'))
    
    # Site üyeliği ekle
    membership_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO user_site_memberships (id, user_id, site_id, is_owner)
        VALUES (%s, %s, '1', %s)
    """, (membership_id, user_id, is_owner))
    
    return user_id, full_name

# Sahibi olmayan dairelere malik ekle
print(f"\n" + "=" * 80)
print("MALİK ATAMA")
print("=" * 80)

cursor.execute("""
    SELECT id, unit_number, block_name
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0 
    AND (owner_user_id IS NULL OR owner_user_id = '')
    ORDER BY unit_number
""")
apartments_without_owner = cursor.fetchall()

owner_count = 0
for apt in apartments_without_owner:
    user_id, full_name = create_resident(is_owner=True)
    
    cursor.execute("""
        UPDATE apartments 
        SET owner_user_id = %s
        WHERE id = %s
    """, (user_id, apt['id']))
    
    owner_count += 1
    print(f"✓ {apt['block_name']} - Daire {apt['unit_number']}: {full_name} (Malik)")

conn.commit()
print(f"\n{owner_count} daireye malik eklendi")

# Kiracı ekle (%40 dairede)
print(f"\n" + "=" * 80)
print("KİRACI ATAMA")
print("=" * 80)

cursor.execute("""
    SELECT id, unit_number, block_name
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0 
    AND (current_resident_id IS NULL OR current_resident_id = '')
    ORDER BY RAND()
    LIMIT %s
""", (target_tenants,))
apartments_for_tenants = cursor.fetchall()

tenant_count = 0
for apt in apartments_for_tenants:
    user_id, full_name = create_resident(is_owner=False)
    
    cursor.execute("""
        UPDATE apartments 
        SET current_resident_id = %s
        WHERE id = %s
    """, (user_id, apt['id']))
    
    tenant_count += 1
    print(f"✓ {apt['block_name']} - Daire {apt['unit_number']}: {full_name} (Kiracı)")

conn.commit()
print(f"\n{tenant_count} daireye kiracı eklendi")

# Son durumu göster
print(f"\n" + "=" * 80)
print("SON DURUM")
print("=" * 80)

cursor.execute("""
    SELECT COUNT(*) as count 
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0 
    AND owner_user_id IS NOT NULL AND owner_user_id != ''
""")
final_owners = cursor.fetchone()['count']

cursor.execute("""
    SELECT COUNT(*) as count 
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0 
    AND current_resident_id IS NOT NULL AND current_resident_id != ''
""")
final_tenants = cursor.fetchone()['count']

cursor.execute("""
    SELECT COUNT(*) as count 
    FROM users u
    JOIN user_site_memberships usm ON u.id = usm.user_id
    WHERE usm.site_id = '1' AND u.is_deleted = 0
    AND (u.roles LIKE '%RESIDENT%' OR u.roles LIKE '%OWNER%' OR u.roles LIKE '%TENANT%')
""")
final_residents = cursor.fetchone()['count']

print(f"Malik olan daire sayısı: {final_owners}")
print(f"Kiracı olan daire sayısı: {final_tenants}")
print(f"Toplam sakin sayısı: {final_residents}")
print(f"\n✓ Tüm dairelere sakin atandı!")
print(f"✓ Malik sayısı ({final_owners}) > Kiracı sayısı ({final_tenants})")
print("=" * 80)

cursor.close()
conn.close()
