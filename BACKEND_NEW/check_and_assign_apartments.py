import mysql.connector
import sys

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor()

print("=== APARTMENTS TABLO YAPISI ===")
cursor.execute("DESCRIBE apartments")
columns = cursor.fetchall()
for col in columns:
    print(f"Column: {col[0]}, Type: {col[1]}")

print("\n=== USERS TABLO YAPISI ===")
cursor.execute("DESCRIBE users")
columns = cursor.fetchall()
for col in columns:
    print(f"Column: {col[0]}, Type: {col[1]}")

print("\n=== MEVCUT BLOKLAR ===")
cursor.execute("SELECT id, name FROM blocks WHERE site_id = 1")
blocks = cursor.fetchall()
for block in blocks:
    print(f"Block ID: {block[0]}, Name: {block[1]}")

print("\n=== MEVCUT DAİRELER ===")
cursor.execute("""
    SELECT a.id, a.unit_number, b.name as block_name, a.floor 
    FROM apartments a 
    JOIN blocks b ON a.block_id = b.id 
    WHERE b.site_id = 1
    ORDER BY b.name, a.unit_number
""")
apartments = cursor.fetchall()
for apt in apartments:
    print(f"Apartment ID: {apt[0]}, Number: {apt[1]}, Block: {apt[2]}, Floor: {apt[3]}")

print("\n=== DAİRESİZ KULLANICILAR (RESIDENT) ===")
cursor.execute("""
    SELECT u.id, u.full_name, u.phone, u.email
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE u.site_id = 1 
    AND r.name = 'RESIDENT'
    AND u.id NOT IN (
        SELECT DISTINCT current_resident_id 
        FROM apartments 
        WHERE current_resident_id IS NOT NULL
    )
    AND u.id NOT IN (
        SELECT DISTINCT owner_user_id 
        FROM apartments 
        WHERE owner_user_id IS NOT NULL
    )
""")
users_without_apt = cursor.fetchall()

if not users_without_apt:
    print("Tüm sakinlerin dairesi var!")
else:
    print(f"\n{len(users_without_apt)} sakin dairesiz:")
    for user in users_without_apt:
        print(f"User ID: {user[0]}, Name: {user[1]}, Phone: {user[2]}, Email: {user[3]}")
    
    # Dairelere atama yap
    if blocks and apartments:
        print("\n=== DAİRELERE ATAMA YAPILIYOR ===")
        
        # Her kullanıcıyı sırayla dairelere ata
        for i, user in enumerate(users_without_apt):
            user_id = user[0]
            user_name = user[1]
            
            # Daire seç (döngüsel olarak)
            apt = apartments[i % len(apartments)]
            apt_id = apt[0]
            apt_number = apt[1]
            block_name = apt[2]
            
            # Kullanıcıyı daireye ata
            try:
                cursor.execute("""
                    UPDATE apartments 
                    SET current_resident_id = %s, owner_user_id = %s, status = 'dolu'
                    WHERE id = %s
                """, (user_id, user_id, apt_id))
                
                print(f"✓ {user_name} -> Daire {apt_number} ({block_name} Blok)")
            except Exception as e:
                print(f"✗ Hata: {user_name} atanamadı - {e}")
        
        conn.commit()
        print("\n✓ Atamalar tamamlandı!")
    else:
        print("\n✗ Blok veya daire bulunamadı!")

cursor.close()
conn.close()
