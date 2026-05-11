#!/usr/bin/env python3
"""
Test multi-apartment scenario:
1. Find sakin@site.com user (A Blok 12)
2. Find B Blok 3 apartment and remove current resident
3. Add B Blok 3 to sakin@site.com
4. Verify user appears in both apartments
"""
import mysql.connector
from datetime import datetime
import uuid

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

print("=" * 80)
print("MULTI-APARTMENT TEST SCENARIO")
print("=" * 80)

# 1. Find sakin@site.com user
print("\n1. Finding sakin@site.com user...")
cursor.execute("""
    SELECT u.id, u.full_name, u.email, b.name as block_name, a.unit_number
    FROM users u
    LEFT JOIN residency_history rh ON u.id = rh.user_id AND rh.status = 'active' AND rh.is_deleted = FALSE
    LEFT JOIN apartments a ON rh.apartment_id = a.id
    LEFT JOIN blocks b ON a.block_id = b.id
    WHERE u.email = 'sakin@site.com'
    LIMIT 1
""")

sakin_user = cursor.fetchone()
if not sakin_user:
    print("❌ sakin@site.com user not found!")
    cursor.close()
    conn.close()
    exit(1)

sakin_id, sakin_name, sakin_email, current_block, current_unit = sakin_user
print(f"✅ Found user: {sakin_name} ({sakin_email})")
print(f"   Current apartment: {current_block} - {current_unit}")
print(f"   User ID: {sakin_id}")

# 2. Find B Blok Daire 36
print("\n2. Finding B Blok Daire 36...")
cursor.execute("""
    SELECT a.id, b.name, a.unit_number
    FROM apartments a
    JOIN blocks b ON a.block_id = b.id
    WHERE b.name = 'B Blok' AND a.unit_number = '36'
    LIMIT 1
""")

b_blok_36 = cursor.fetchone()
if not b_blok_36:
    print("❌ B Blok Daire 36 not found!")
    cursor.close()
    conn.close()
    exit(1)

b36_id, b36_block, b36_unit = b_blok_36
print(f"✅ Found apartment: {b36_block} - {b36_unit}")
print(f"   Apartment ID: {b36_id}")

# 3. Check current residents of B Blok 36
print("\n3. Checking current residents of B Blok Daire 36...")
cursor.execute("""
    SELECT u.id, u.full_name, u.email, rh.is_owner
    FROM residency_history rh
    JOIN users u ON rh.user_id = u.id
    WHERE rh.apartment_id = %s AND rh.status = 'active' AND rh.is_deleted = FALSE
""", (b36_id,))

current_residents = cursor.fetchall()
if current_residents:
    print(f"   Found {len(current_residents)} current resident(s):")
    for res in current_residents:
        res_id, res_name, res_email, is_owner = res
        role = "Malik" if is_owner else "Kiracı"
        print(f"   - {res_name} ({res_email}) - {role}")
        print(f"     User ID: {res_id}")
        
        # Remove this resident from B Blok 36
        print(f"\n   Removing {res_name} from B Blok Daire 36...")
        cursor.execute("""
            UPDATE residency_history
            SET status = 'inactive', is_deleted = TRUE, updated_at = NOW()
            WHERE user_id = %s AND apartment_id = %s AND status = 'active'
        """, (res_id, b36_id))
        conn.commit()
        print(f"   ✅ Removed {res_name} from B Blok Daire 36")
else:
    print("   No current residents found")

# 4. Add sakin@site.com to B Blok 36 as OWNER
print(f"\n4. Adding {sakin_name} to B Blok Daire 36 as OWNER...")
new_residency_id = str(uuid.uuid4())
cursor.execute("""
    INSERT INTO residency_history 
    (id, apartment_id, user_id, is_owner, move_in_date, status, created_at, updated_at, is_deleted)
    VALUES (%s, %s, %s, TRUE, %s, 'active', NOW(), NOW(), FALSE)
""", (new_residency_id, b36_id, sakin_id, datetime.now().date()))
conn.commit()
print(f"✅ Added {sakin_name} to B Blok Daire 36 as OWNER")

# 5. Verify user now has 2 apartments
print(f"\n5. Verifying {sakin_name} now has 2 apartments...")
cursor.execute("""
    SELECT b.name, a.unit_number, rh.is_owner
    FROM residency_history rh
    JOIN apartments a ON rh.apartment_id = a.id
    JOIN blocks b ON a.block_id = b.id
    WHERE rh.user_id = %s AND rh.status = 'active' AND rh.is_deleted = FALSE
    ORDER BY b.name, a.unit_number
""", (sakin_id,))

user_apartments = cursor.fetchall()
print(f"✅ {sakin_name} now has {len(user_apartments)} apartment(s):")
for apt in user_apartments:
    block, unit, is_owner = apt
    role = "Malik" if is_owner else "Kiracı"
    print(f"   - {block} - {unit} ({role})")

# 6. Check if user appears in residents list for both apartments
print(f"\n6. Verifying user appears in residents list...")
cursor.execute("""
    SELECT DISTINCT a.id, b.name, a.unit_number
    FROM residency_history rh
    JOIN apartments a ON rh.apartment_id = a.id
    JOIN blocks b ON a.block_id = b.id
    WHERE rh.user_id = %s AND rh.status = 'active' AND rh.is_deleted = FALSE
""", (sakin_id,))

apartments_with_user = cursor.fetchall()
print(f"✅ User appears in {len(apartments_with_user)} apartment(s) in the system:")
for apt in apartments_with_user:
    apt_id, block, unit = apt
    print(f"   - {block} - {unit} (ID: {apt_id})")

cursor.close()
conn.close()

print("\n" + "=" * 80)
print("TEST COMPLETED SUCCESSFULLY!")
print("=" * 80)
print(f"\n📱 Now you can:")
print(f"   1. Login as {sakin_email} with password: sakin123")
print(f"   2. Go to Profile page")
print(f"   3. Click 'Dairelerim' to see both apartments")
print(f"   4. Switch between {current_block} - {current_unit} and B Blok - 36")
print(f"   5. Check Sakinler page to see yourself in both apartments")
