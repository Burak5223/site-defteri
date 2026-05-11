import mysql.connector

# Veritabanı bağlantısı
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

print("=== SITE 1 (YEŞILVADI) ANALYSIS ===\n")

# 1. Site 1'deki toplam daireler
cursor.execute("""
    SELECT COUNT(*) 
    FROM apartments a
    JOIN blocks b ON a.block_id = b.id
    WHERE b.site_id = '1'
    AND a.block_name IS NOT NULL
    AND a.block_name != 'None'
""")
total_apartments = cursor.fetchone()[0]
print(f"Total apartments in Site 1: {total_apartments}")

# 2. Site 1'deki dolu daireler
cursor.execute("""
    SELECT COUNT(*) 
    FROM apartments a
    JOIN blocks b ON a.block_id = b.id
    WHERE b.site_id = '1'
    AND a.block_name IS NOT NULL
    AND a.block_name != 'None'
    AND a.current_resident_id IS NOT NULL
""")
occupied_apartments = cursor.fetchone()[0]
print(f"Occupied apartments: {occupied_apartments}")

# 3. Site 1'deki boş daireler
empty_apartments = total_apartments - occupied_apartments
print(f"Empty apartments: {empty_apartments}")

# 4. Site 1'e üye olan sakinler
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
print(f"\nTotal residents in Site 1: {total_residents}")

# 5. Site 1'de daire atanmış sakinler
cursor.execute("""
    SELECT COUNT(DISTINCT u.id)
    FROM users u
    JOIN user_site_memberships usm ON u.id = usm.user_id
    WHERE usm.site_id = '1'
    AND usm.role_type = 'sakin'
    AND usm.status = 'aktif'
    AND usm.is_deleted = 0
    AND (
        u.id IN (SELECT current_resident_id FROM apartments WHERE current_resident_id IS NOT NULL)
        OR u.id IN (SELECT owner_user_id FROM apartments WHERE owner_user_id IS NOT NULL)
    )
""")
assigned_residents = cursor.fetchone()[0]
print(f"Residents with apartments: {assigned_residents}")

# 6. Site 1'de daire atanmamış sakinler
unassigned_residents = total_residents - assigned_residents
print(f"Residents without apartments: {unassigned_residents}")

print("\n=== RECOMMENDATION ===")
if unassigned_residents > 0:
    if empty_apartments >= unassigned_residents:
        print(f"✓ We have {empty_apartments} empty apartments for {unassigned_residents} unassigned residents")
        print("  → We can assign all residents to apartments")
    else:
        print(f"✗ We have only {empty_apartments} empty apartments for {unassigned_residents} unassigned residents")
        print(f"  → We need {unassigned_residents - empty_apartments} more apartments")
        print("  → Option 1: Remove excess residents from user_site_memberships")
        print("  → Option 2: Create more apartments")
else:
    print("✓ All residents are already assigned to apartments!")

cursor.close()
conn.close()

print("\n=== DONE ===")
