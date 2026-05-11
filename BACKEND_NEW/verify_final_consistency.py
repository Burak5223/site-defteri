import mysql.connector

# Veritabanı bağlantısı
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

print("=== FINAL CONSISTENCY CHECK ===\n")

# 1. Site 1'deki toplam sakinler
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
print(f"Total residents in Site 1: {total_residents}")

# 2. Dairelerde current_resident olarak atanmış kullanıcılar
cursor.execute("""
    SELECT COUNT(DISTINCT a.current_resident_id)
    FROM apartments a
    JOIN blocks b ON a.block_id = b.id
    WHERE b.site_id = '1'
    AND a.current_resident_id IS NOT NULL
""")
current_residents = cursor.fetchone()[0]
print(f"Unique current_resident_id count: {current_residents}")

# 3. Dairelerde owner olarak atanmış kullanıcılar
cursor.execute("""
    SELECT COUNT(DISTINCT a.owner_user_id)
    FROM apartments a
    JOIN blocks b ON a.block_id = b.id
    WHERE b.site_id = '1'
    AND a.owner_user_id IS NOT NULL
""")
owners = cursor.fetchone()[0]
print(f"Unique owner_user_id count: {owners}")

# 4. Hem owner hem resident olan kullanıcılar
cursor.execute("""
    SELECT COUNT(DISTINCT a.current_resident_id)
    FROM apartments a
    JOIN blocks b ON a.block_id = b.id
    WHERE b.site_id = '1'
    AND a.current_resident_id IS NOT NULL
    AND a.owner_user_id IS NOT NULL
    AND a.current_resident_id = a.owner_user_id
""")
both_owner_and_resident = cursor.fetchone()[0]
print(f"Users who are both owner and resident: {both_owner_and_resident}")

# 5. Toplam benzersiz kullanıcı sayısı (dairelerde)
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
print(f"Unique users in apartments: {unique_users_in_apartments}")

# 6. user_site_memberships'te olup dairede olmayan kullanıcılar
cursor.execute("""
    SELECT u.id, u.full_name, u.email
    FROM users u
    JOIN user_site_memberships usm ON u.id = usm.user_id
    WHERE usm.site_id = '1'
    AND usm.role_type = 'sakin'
    AND usm.status = 'aktif'
    AND usm.is_deleted = 0
    AND u.id NOT IN (
        SELECT current_resident_id FROM apartments WHERE current_resident_id IS NOT NULL
        UNION
        SELECT owner_user_id FROM apartments WHERE owner_user_id IS NOT NULL
    )
""")
unassigned = cursor.fetchall()
print(f"\nResidents without apartments: {len(unassigned)}")
if unassigned:
    for user in unassigned[:5]:
        print(f"  - {user[1]} ({user[2]})")

# 7. Dairede olup user_site_memberships'te olmayan kullanıcılar
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
not_in_membership = cursor.fetchall()
print(f"\nUsers in apartments but not in memberships: {len(not_in_membership)}")
if not_in_membership:
    for user in not_in_membership[:5]:
        print(f"  - {user[1]} ({user[2]})")

print("\n=== SUMMARY ===")
if total_residents == unique_users_in_apartments and len(unassigned) == 0 and len(not_in_membership) == 0:
    print("✓ PERFECT! All data is consistent:")
    print(f"  - {total_residents} residents")
    print(f"  - {unique_users_in_apartments} unique users in apartments")
    print(f"  - All residents have apartments")
    print(f"  - All apartment users are in memberships")
else:
    print("⚠ Inconsistencies found:")
    print(f"  - Residents in memberships: {total_residents}")
    print(f"  - Unique users in apartments: {unique_users_in_apartments}")
    print(f"  - Residents without apartments: {len(unassigned)}")
    print(f"  - Apartment users not in memberships: {len(not_in_membership)}")

cursor.close()
conn.close()

print("\n=== DONE ===")
