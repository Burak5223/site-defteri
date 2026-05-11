import mysql.connector

# Veritabanı bağlantısı
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

print("=== RESIDENT ROLE COUNTS ===\n")

# 1. user_site_memberships'te sakin rolü olanlar
cursor.execute("""
    SELECT COUNT(DISTINCT user_id) 
    FROM user_site_memberships 
    WHERE role_type = 'sakin' 
    AND status = 'aktif' 
    AND is_deleted = 0
""")
active_residents = cursor.fetchone()[0]
print(f"Active residents in user_site_memberships: {active_residents}")

# 2. Dairelerde atanmış sakinler
cursor.execute("""
    SELECT COUNT(DISTINCT current_resident_id) 
    FROM apartments 
    WHERE current_resident_id IS NOT NULL
""")
residents_in_apartments = cursor.fetchone()[0]
print(f"Residents assigned in apartments: {residents_in_apartments}")

# 3. Dairelerde atanmış malikler
cursor.execute("""
    SELECT COUNT(DISTINCT owner_user_id) 
    FROM apartments 
    WHERE owner_user_id IS NOT NULL
""")
owners_in_apartments = cursor.fetchone()[0]
print(f"Owners assigned in apartments: {owners_in_apartments}")

# 4. Dairede atanmış ama user_site_memberships'te olmayan kullanıcılar
cursor.execute("""
    SELECT COUNT(DISTINCT a.current_resident_id)
    FROM apartments a
    WHERE a.current_resident_id IS NOT NULL
    AND a.current_resident_id NOT IN (
        SELECT user_id 
        FROM user_site_memberships 
        WHERE role_type = 'sakin' 
        AND status = 'aktif' 
        AND is_deleted = 0
    )
""")
missing_memberships = cursor.fetchone()[0]
print(f"Residents in apartments but NOT in user_site_memberships: {missing_memberships}")

# 5. Örnek eksik kullanıcılar
if missing_memberships > 0:
    print("\n=== SAMPLE MISSING USERS ===\n")
    cursor.execute("""
        SELECT 
            u.id,
            u.full_name,
            u.email,
            a.block_name,
            a.unit_number
        FROM users u
        JOIN apartments a ON u.id = a.current_resident_id
        WHERE u.id NOT IN (
            SELECT user_id 
            FROM user_site_memberships 
            WHERE role_type = 'sakin' 
            AND status = 'aktif' 
            AND is_deleted = 0
        )
        LIMIT 10
    """)
    
    missing_users = cursor.fetchall()
    for user in missing_users:
        print(f"ID: {user[0]}")
        print(f"Name: {user[1]}")
        print(f"Email: {user[2]}")
        print(f"Apartment: {user[3]} - {user[4]}")
        print("---")

cursor.close()
conn.close()

print("\n=== DONE ===")
