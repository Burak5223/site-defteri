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

print("=== ASSIGNING ALL RESIDENTS TO APARTMENTS ===\n")

# 1. user_site_memberships'te 'sakin' rolüne sahip kullanıcıları bul
cursor.execute("""
    SELECT DISTINCT u.id, u.full_name, u.email, usm.site_id
    FROM users u
    JOIN user_site_memberships usm ON u.id = usm.user_id
    WHERE usm.role_type = 'sakin'
    AND usm.status = 'aktif'
    AND usm.is_deleted = 0
    AND u.id NOT IN (
        SELECT DISTINCT current_resident_id 
        FROM apartments 
        WHERE current_resident_id IS NOT NULL
        UNION
        SELECT DISTINCT owner_user_id 
        FROM apartments 
        WHERE owner_user_id IS NOT NULL
    )
""")

unassigned_residents = cursor.fetchall()
print(f"Found {len(unassigned_residents)} residents without apartments\n")

if len(unassigned_residents) == 0:
    print("✓ All residents are already assigned to apartments!")
    cursor.close()
    conn.close()
    exit(0)

# 2. Her site için boş daireleri bul ve sakinleri ata
for resident in unassigned_residents:
    user_id, full_name, email, site_id = resident
    
    # Bu site için boş daireleri bul (blok_name NULL olmayanlar)
    cursor.execute("""
        SELECT a.id, a.block_name, a.unit_number, a.floor
        FROM apartments a
        JOIN blocks b ON a.block_id = b.id
        WHERE b.site_id = %s
        AND a.current_resident_id IS NULL
        AND a.block_name IS NOT NULL
        AND a.block_name != 'None'
        ORDER BY a.block_name, a.unit_number
        LIMIT 1
    """, (site_id,))
    
    empty_apartment = cursor.fetchone()
    
    if empty_apartment:
        apt_id, block_name, unit_number, floor = empty_apartment
        
        # Rastgele owner veya tenant seç
        resident_type = random.choice(['owner', 'tenant'])
        
        if resident_type == 'owner':
            # Malik olarak ata
            cursor.execute("""
                UPDATE apartments 
                SET owner_user_id = %s, current_resident_id = %s
                WHERE id = %s
            """, (user_id, user_id, apt_id))
        else:
            # Kiracı olarak ata
            cursor.execute("""
                UPDATE apartments 
                SET current_resident_id = %s
                WHERE id = %s
            """, (user_id, apt_id))
        
        conn.commit()
        print(f"✓ Assigned: {full_name}")
        print(f"  → {block_name} - {unit_number} (Floor {floor}) as {resident_type}")
        print(f"  → Site ID: {site_id}")
        print()
    else:
        print(f"✗ No empty apartment found for: {full_name} (Site: {site_id})")
        print()

# 3. Sonuçları kontrol et
cursor.execute("""
    SELECT COUNT(DISTINCT u.id)
    FROM users u
    JOIN user_site_memberships usm ON u.id = usm.user_id
    WHERE usm.role_type = 'sakin'
    AND usm.status = 'aktif'
    AND usm.is_deleted = 0
    AND u.id NOT IN (
        SELECT DISTINCT current_resident_id 
        FROM apartments 
        WHERE current_resident_id IS NOT NULL
        UNION
        SELECT DISTINCT owner_user_id 
        FROM apartments 
        WHERE owner_user_id IS NOT NULL
    )
""")

remaining_unassigned = cursor.fetchone()[0]

print("\n=== SUMMARY ===")
print(f"Total residents processed: {len(unassigned_residents)}")
print(f"Successfully assigned: {len(unassigned_residents) - remaining_unassigned}")
print(f"Still unassigned: {remaining_unassigned}")

if remaining_unassigned > 0:
    print("\n⚠ Warning: Some residents could not be assigned (no empty apartments available)")

cursor.close()
conn.close()

print("\n=== DONE ===")
