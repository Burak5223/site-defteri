#!/usr/bin/env python3
"""
Check apartment table fields and update them based on residency_history
"""
import mysql.connector

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

print("=" * 80)
print("CHECKING APARTMENT FIELDS")
print("=" * 80)

# 1. Check apartment table structure
print("\n1. Checking apartment table structure...")
cursor.execute("DESCRIBE apartments")
columns = cursor.fetchall()

print("✅ Apartment table columns:")
for col in columns:
    print(f"   - {col[0]}: {col[1]} ({col[2]})")

# 2. Check current values in apartments
print(f"\n2. Checking current apartment values...")
cursor.execute("""
    SELECT id, unit_number, current_resident_id, owner_user_id, 
           (SELECT name FROM blocks WHERE id = block_id) as block_name
    FROM apartments 
    WHERE block_id IN (SELECT id FROM blocks WHERE site_id = 1)
    ORDER BY block_name, CAST(unit_number AS UNSIGNED)
    LIMIT 10
""")

apartments = cursor.fetchall()
print(f"✅ Found {len(apartments)} apartments (showing first 10):")
for apt in apartments:
    apt_id, unit, current_resident, owner, block = apt
    print(f"   - {block} - {unit}: current_resident_id={current_resident}, owner_user_id={owner}")

# 3. Check residency_history data
print(f"\n3. Checking residency_history data...")
cursor.execute("""
    SELECT b.name, a.unit_number, u.full_name, u.email, rh.is_owner, a.id as apt_id, u.id as user_id
    FROM residency_history rh
    JOIN apartments a ON rh.apartment_id = a.id
    JOIN blocks b ON a.block_id = b.id
    JOIN users u ON rh.user_id = u.id
    WHERE b.site_id = 1 
      AND rh.status = 'active' 
      AND rh.is_deleted = FALSE
    ORDER BY b.name, CAST(a.unit_number AS UNSIGNED)
""")

residencies = cursor.fetchall()
print(f"✅ Found {len(residencies)} active residencies:")
for res in residencies:
    block, unit, name, email, is_owner, apt_id, user_id = res
    role = "Owner" if is_owner else "Resident"
    print(f"   - {block} - {unit}: {name} ({role}) - apt_id: {apt_id}, user_id: {user_id}")

# 4. Update apartment fields based on residency_history
print(f"\n4. Updating apartment fields based on residency_history...")

for res in residencies:
    block, unit, name, email, is_owner, apt_id, user_id = res
    
    if is_owner:
        # Update owner_user_id
        cursor.execute("""
            UPDATE apartments 
            SET owner_user_id = %s 
            WHERE id = %s
        """, (user_id, apt_id))
        print(f"   ✅ Updated {block} - {unit}: owner_user_id = {user_id} ({name})")
    else:
        # Update current_resident_id
        cursor.execute("""
            UPDATE apartments 
            SET current_resident_id = %s 
            WHERE id = %s
        """, (user_id, apt_id))
        print(f"   ✅ Updated {block} - {unit}: current_resident_id = {user_id} ({name})")

conn.commit()

# 5. Verify updates
print(f"\n5. Verifying updates...")
cursor.execute("""
    SELECT a.id, b.name, a.unit_number, a.current_resident_id, a.owner_user_id,
           u1.full_name as resident_name, u2.full_name as owner_name
    FROM apartments a
    JOIN blocks b ON a.block_id = b.id
    LEFT JOIN users u1 ON a.current_resident_id = u1.id
    LEFT JOIN users u2 ON a.owner_user_id = u2.id
    WHERE b.site_id = 1 
      AND (a.current_resident_id IS NOT NULL OR a.owner_user_id IS NOT NULL)
    ORDER BY b.name, CAST(a.unit_number AS UNSIGNED)
""")

updated_apartments = cursor.fetchall()
print(f"✅ Verified {len(updated_apartments)} apartments with residents:")
for apt in updated_apartments:
    apt_id, block, unit, resident_id, owner_id, resident_name, owner_name = apt
    print(f"   - {block} - {unit}:")
    if resident_name:
        print(f"     Resident: {resident_name} (ID: {resident_id})")
    if owner_name:
        print(f"     Owner: {owner_name} (ID: {owner_id})")

cursor.close()
conn.close()

print("\n" + "=" * 80)
print("APARTMENT FIELDS UPDATE COMPLETED")
print("=" * 80)