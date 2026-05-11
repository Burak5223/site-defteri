import mysql.connector

# Veritabanı bağlantısı
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

print("=== CHECKING RESIDENTS DATA ===\n")

# 1. Tüm kullanıcıları kontrol et
cursor.execute("SELECT COUNT(*) FROM users")
total_users = cursor.fetchone()[0]
print(f"Total users in database: {total_users}")

# 2. RESIDENT rolüne sahip kullanıcıları kontrol et
cursor.execute("""
    SELECT COUNT(DISTINCT user_id) 
    FROM user_site_memberships
    WHERE role_type IN ('RESIDENT', 'OWNER', 'TENANT')
""")
resident_count = cursor.fetchone()[0]
print(f"Users with RESIDENT role: {resident_count}")

# 3. Dairelerde sakin olarak atanmış kullanıcıları kontrol et
cursor.execute("""
    SELECT COUNT(DISTINCT current_resident_id) 
    FROM apartments 
    WHERE current_resident_id IS NOT NULL
""")
residents_in_apartments = cursor.fetchone()[0]
print(f"Users assigned as residents in apartments: {residents_in_apartments}")

# 4. Dairelerde malik olarak atanmış kullanıcıları kontrol et
cursor.execute("""
    SELECT COUNT(DISTINCT owner_user_id) 
    FROM apartments 
    WHERE owner_user_id IS NOT NULL
""")
owners_in_apartments = cursor.fetchone()[0]
print(f"Users assigned as owners in apartments: {owners_in_apartments}")

# 5. user_site_memberships tablosundaki kullanıcıları kontrol et
cursor.execute("SELECT COUNT(DISTINCT user_id) FROM user_site_memberships")
users_in_memberships = cursor.fetchone()[0]
print(f"Users in user_site_memberships: {users_in_memberships}")

print("\n=== SAMPLE RESIDENT DATA ===\n")

# 6. Örnek sakin verisi göster (dairede atanmış)
cursor.execute("""
    SELECT 
        u.id,
        u.full_name,
        u.email,
        a.block_name,
        a.unit_number,
        CASE 
            WHEN a.owner_user_id = u.id THEN 'owner'
            WHEN a.current_resident_id = u.id THEN 'tenant'
        END as resident_type,
        (SELECT GROUP_CONCAT(role_type) FROM user_site_memberships WHERE user_id = u.id) as roles
    FROM users u
    LEFT JOIN apartments a ON (u.id = a.current_resident_id OR u.id = a.owner_user_id)
    WHERE a.id IS NOT NULL
    LIMIT 5
""")

residents = cursor.fetchall()
for r in residents:
    print(f"ID: {r[0]}")
    print(f"Name: {r[1]}")
    print(f"Email: {r[2]}")
    print(f"Block: {r[3]}, Unit: {r[4]}")
    print(f"Type: {r[5]}")
    print(f"Roles: {r[6]}")
    print("---")

print("\n=== CHECKING SITE MEMBERSHIPS ===\n")

# 7. Site membership kontrolü
cursor.execute("""
    SELECT 
        u.id,
        u.full_name,
        usm.site_id,
        usm.role_type
    FROM users u
    LEFT JOIN user_site_memberships usm ON u.id = usm.user_id
    WHERE u.id IN (
        SELECT DISTINCT current_resident_id FROM apartments WHERE current_resident_id IS NOT NULL
        UNION
        SELECT DISTINCT owner_user_id FROM apartments WHERE owner_user_id IS NOT NULL
    )
    LIMIT 5
""")

memberships = cursor.fetchall()
print("Sample residents and their site memberships:")
for m in memberships:
    print(f"User: {m[1]} (ID: {m[0]})")
    print(f"Site ID: {m[2]}, Role: {m[3]}")
    print("---")

cursor.close()
conn.close()

print("\n=== DONE ===")
