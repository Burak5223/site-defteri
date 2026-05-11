import mysql.connector

# Veritabanı bağlantısı
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

print("=== CLEANING UP RESIDENTS FROM OTHER SITES ===\n")

# 1. Site 1 dışındaki sitelerdeki sakinleri bul
cursor.execute("""
    SELECT DISTINCT 
        u.id, 
        u.full_name, 
        u.email, 
        usm.site_id,
        s.name as site_name
    FROM users u
    JOIN user_site_memberships usm ON u.id = usm.user_id
    LEFT JOIN sites s ON usm.site_id = s.id
    WHERE usm.site_id != '1'
    AND usm.role_type = 'sakin'
    AND usm.status = 'aktif'
    AND usm.is_deleted = 0
""")

other_site_residents = cursor.fetchall()
print(f"Found {len(other_site_residents)} residents in other sites\n")

if len(other_site_residents) == 0:
    print("✓ No residents found in other sites!")
    cursor.close()
    conn.close()
    exit(0)

# 2. Bu sakinlerin user_site_memberships kayıtlarını sil
deleted_count = 0
for resident in other_site_residents:
    user_id, full_name, email, site_id, site_name = resident
    
    # user_site_memberships'ten sil
    cursor.execute("""
        DELETE FROM user_site_memberships
        WHERE user_id = %s
        AND site_id = %s
        AND role_type = 'sakin'
    """, (user_id, site_id))
    
    deleted_count += cursor.rowcount
    
    if cursor.rowcount > 0:
        print(f"✓ Removed: {full_name} from site '{site_name}' (ID: {site_id})")

conn.commit()

print(f"\n=== SUMMARY ===")
print(f"Total memberships removed: {deleted_count}")

# 3. Şimdi Site 1'deki durumu kontrol et
cursor.execute("""
    SELECT COUNT(DISTINCT u.id)
    FROM users u
    JOIN user_site_memberships usm ON u.id = usm.user_id
    WHERE usm.site_id = '1'
    AND usm.role_type = 'sakin'
    AND usm.status = 'aktif'
    AND usm.is_deleted = 0
""")
site1_residents = cursor.fetchone()[0]

cursor.execute("""
    SELECT COUNT(DISTINCT current_resident_id)
    FROM apartments a
    JOIN blocks b ON a.block_id = b.id
    WHERE b.site_id = '1'
    AND a.current_resident_id IS NOT NULL
""")
site1_assigned = cursor.fetchone()[0]

print(f"\n=== SITE 1 STATUS ===")
print(f"Total residents: {site1_residents}")
print(f"Assigned to apartments: {site1_assigned}")
print(f"Match: {'✓ YES' if site1_residents == site1_assigned else '✗ NO'}")

cursor.close()
conn.close()

print("\n=== DONE ===")
