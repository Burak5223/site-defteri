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

print("=== ADDING MISSING MEMBERSHIPS ===\n")

# 1. Dairede olup user_site_memberships'te olmayan kullanıcıları bul
cursor.execute("""
    SELECT DISTINCT u.id, u.full_name, u.email
    FROM users u
    WHERE u.id IN (
        SELECT current_resident_id FROM apartments WHERE current_resident_id IS NOT NULL
        UNION
        SELECT owner_user_id FROM apartments WHERE owner_user_id IS NOT NULL
    )
    AND u.id NOT IN (
        SELECT user_id 
        FROM user_site_memberships 
        WHERE site_id = '1' 
        AND role_type = 'sakin'
        AND status = 'aktif'
        AND is_deleted = 0
    )
""")

missing_users = cursor.fetchall()
print(f"Found {len(missing_users)} users without memberships\n")

if len(missing_users) == 0:
    print("✓ All users already have memberships!")
    cursor.close()
    conn.close()
    exit(0)

# 2. Her kullanıcı için membership ekle
added_count = 0
for user in missing_users:
    user_id, full_name, email = user
    
    # Yeni membership ID oluştur
    membership_id = str(uuid.uuid4())
    
    # user_site_memberships'e ekle
    cursor.execute("""
        INSERT INTO user_site_memberships 
        (id, user_id, site_id, role_type, status, is_deleted, created_at, updated_at)
        VALUES (%s, %s, '1', 'sakin', 'aktif', 0, NOW(), NOW())
    """, (membership_id, user_id))
    
    added_count += 1
    print(f"✓ Added membership for: {full_name} ({email})")

conn.commit()

print(f"\n=== SUMMARY ===")
print(f"Total memberships added: {added_count}")

# 3. Final verification
cursor.execute("""
    SELECT COUNT(DISTINCT u.id)
    FROM users u
    JOIN user_site_memberships usm ON u.id = usm.user_id
    WHERE usm.site_id = '1'
    AND usm.role_type = 'sakin'
    AND usm.status = 'aktif'
    AND usm.is_deleted = 0
""")
total_residents = cursor.fetchone()[0]

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
unique_users_in_apartments = cursor.fetchone()[0]

print(f"\n=== FINAL STATUS ===")
print(f"Residents in memberships: {total_residents}")
print(f"Unique users in apartments: {unique_users_in_apartments}")
print(f"Match: {'✓ YES' if total_residents == unique_users_in_apartments else '✗ NO'}")

cursor.close()
conn.close()

print("\n=== DONE ===")
