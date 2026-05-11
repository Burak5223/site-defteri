import mysql.connector
import uuid
import bcrypt

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor()

# RESIDENT role ID'sini al
cursor.execute("SELECT id FROM roles WHERE name = 'RESIDENT'")
result = cursor.fetchone()
if not result:
    print("✗ RESIDENT rolü bulunamadı!")
    cursor.close()
    conn.close()
    exit(1)

resident_role_id = result[0]
print(f"✓ RESIDENT role ID: {resident_role_id}")

# Test sakinleri oluştur
test_residents = [
    {"name": "Ahmet Yılmaz", "phone": "5551234567", "email": "ahmet@test.com"},
    {"name": "Ayşe Demir", "phone": "5551234568", "email": "ayse@test.com"},
    {"name": "Mehmet Kaya", "phone": "5551234569", "email": "mehmet@test.com"},
    {"name": "Fatma Şahin", "phone": "5551234570", "email": "fatma@test.com"},
    {"name": "Ali Çelik", "phone": "5551234571", "email": "ali@test.com"},
    {"name": "Zeynep Arslan", "phone": "5551234572", "email": "zeynep@test.com"},
    {"name": "Mustafa Öztürk", "phone": "5551234573", "email": "mustafa@test.com"},
    {"name": "Elif Yıldız", "phone": "5551234574", "email": "elif@test.com"},
    {"name": "Hasan Aydın", "phone": "5551234575", "email": "hasan@test.com"},
    {"name": "Merve Koç", "phone": "5551234576", "email": "merve@test.com"},
]

print(f"\n=== {len(test_residents)} TEST SAKİNİ OLUŞTURULUYOR ===\n")

# Şifre hash'le (password: 123456)
password = "123456"
hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
password_hash = hashed.decode('utf-8')

created_users = []

for resident in test_residents:
    user_id = str(uuid.uuid4())
    
    try:
        # Kullanıcıyı oluştur
        cursor.execute("""
            INSERT INTO users 
            (id, full_name, email, phone, site_id, password_hash, status, email_verified, phone_verified, created_at)
            VALUES (%s, %s, %s, %s, '1', %s, 'aktif', 1, 1, NOW())
        """, (user_id, resident["name"], resident["email"], resident["phone"], password_hash))
        
        # RESIDENT rolünü ata
        cursor.execute("""
            INSERT INTO user_roles (user_id, role_id)
            VALUES (%s, %s)
        """, (user_id, resident_role_id))
        
        created_users.append((user_id, resident["name"]))
        print(f"✓ {resident['name']} oluşturuldu (ID: {user_id})")
        
    except Exception as e:
        print(f"✗ {resident['name']} oluşturulamadı: {e}")

conn.commit()
print(f"\n✓ {len(created_users)} sakin oluşturuldu!")

# Şimdi boş dairelere ata
print("\n=== BOŞ DAİRELERE SAKİNLER ATANIYOR ===\n")

cursor.execute("""
    SELECT a.id, a.unit_number, a.block_name
    FROM apartments a
    WHERE a.site_id = '1'
    AND (a.current_resident_id IS NULL OR a.current_resident_id = '')
    ORDER BY a.block_name, CAST(a.unit_number AS UNSIGNED)
    LIMIT 50
""")

empty_apartments = cursor.fetchall()

for i, apt in enumerate(empty_apartments):
    apt_id = apt[0]
    apt_number = apt[1]
    block_name = apt[2] if apt[2] else "?"
    
    # Döngüsel olarak sakin ata
    user = created_users[i % len(created_users)]
    user_id = user[0]
    user_name = user[1]
    
    try:
        cursor.execute("""
            UPDATE apartments 
            SET current_resident_id = %s, owner_user_id = %s, status = 'dolu'
            WHERE id = %s
        """, (user_id, user_id, apt_id))
        
        print(f"✓ Daire {apt_number} ({block_name} Blok) -> {user_name}")
    except Exception as e:
        print(f"✗ Hata: Daire {apt_number} - {e}")

conn.commit()
print(f"\n✓ {len(empty_apartments)} daireye sakin atandı!")

print("\n=== ÖZET ===")
print(f"Oluşturulan sakin sayısı: {len(created_users)}")
print(f"Dolu daire sayısı: {len(empty_apartments)}")
print(f"Şifre (hepsi için): {password}")

cursor.close()
conn.close()
