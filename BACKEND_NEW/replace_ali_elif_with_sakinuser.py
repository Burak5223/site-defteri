#!/usr/bin/env python3
"""
Replace Ali Doğan and Elif Kılıç with Sakin User in specific apartments
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
print("REPLACING ALI DOĞAN AND ELİF KILIÇ WITH SAKİN USER")
print("=" * 80)

# Get Sakin User ID
cursor.execute("SELECT id FROM users WHERE email = 'sakin@site.com'")
sakin_result = cursor.fetchone()
if not sakin_result:
    print("❌ Sakin User not found!")
    exit(1)

sakin_user_id = sakin_result[0]
print(f"✅ Sakin User ID: {sakin_user_id}")

# 1. Replace Ali Doğan in A Blok Daire 12
print(f"\n1. Replacing Ali Doğan in A Blok Daire 12...")

# Get A Blok Daire 12 apartment ID
cursor.execute("""
    SELECT a.id FROM apartments a
    JOIN blocks b ON a.block_id = b.id
    WHERE b.name = 'A Blok' AND a.unit_number = '12'
    LIMIT 1
""")

a12_result = cursor.fetchone()
if a12_result:
    a12_apartment_id = a12_result[0]
    print(f"✅ A Blok Daire 12 ID: {a12_apartment_id}")
    
    # Update apartment owner_user_id to Sakin User
    cursor.execute("""
        UPDATE apartments 
        SET owner_user_id = %s 
        WHERE id = %s
    """, (sakin_user_id, a12_apartment_id))
    
    print(f"✅ Updated A Blok Daire 12 owner to Sakin User")
else:
    print("❌ A Blok Daire 12 not found")

# 2. Replace Elif Kılıç in B Blok Daire 36  
print(f"\n2. Replacing Elif Kılıç in B Blok Daire 36...")

# Get B Blok Daire 36 apartment ID
cursor.execute("""
    SELECT a.id FROM apartments a
    JOIN blocks b ON a.block_id = b.id
    WHERE b.name = 'B Blok' AND a.unit_number = '36'
    LIMIT 1
""")

b36_result = cursor.fetchone()
if b36_result:
    b36_apartment_id = b36_result[0]
    print(f"✅ B Blok Daire 36 ID: {b36_apartment_id}")
    
    # Update apartment owner_user_id to Sakin User
    cursor.execute("""
        UPDATE apartments 
        SET owner_user_id = %s 
        WHERE id = %s
    """, (sakin_user_id, b36_apartment_id))
    
    print(f"✅ Updated B Blok Daire 36 owner to Sakin User")
else:
    print("❌ B Blok Daire 36 not found")

# 3. Remove Ali Doğan from A Blok Daire 13 (if exists)
print(f"\n3. Checking Ali Doğan in other apartments...")

cursor.execute("""
    SELECT a.id, b.name, a.unit_number, a.owner_user_id, u.full_name
    FROM apartments a
    JOIN blocks b ON a.block_id = b.id
    LEFT JOIN users u ON a.owner_user_id = u.id
    WHERE u.full_name LIKE '%Ali%' AND u.full_name LIKE '%Doğan%'
""")

ali_apartments = cursor.fetchall()
if ali_apartments:
    print(f"✅ Found Ali Doğan in {len(ali_apartments)} apartment(s):")
    for apt in ali_apartments:
        apt_id, block, unit, owner_id, owner_name = apt
        print(f"   - {block} - Daire {unit}: {owner_name}")
        
        # Remove Ali Doğan from this apartment
        cursor.execute("""
            UPDATE apartments 
            SET owner_user_id = NULL, current_resident_id = NULL
            WHERE id = %s
        """, (apt_id,))
        print(f"   ✅ Removed Ali Doğan from {block} - Daire {unit}")
else:
    print("✅ No Ali Doğan found in apartments")

# 4. Remove Elif Kılıç from other apartments
print(f"\n4. Checking Elif Kılıç in other apartments...")

cursor.execute("""
    SELECT a.id, b.name, a.unit_number, a.owner_user_id, u.full_name
    FROM apartments a
    JOIN blocks b ON a.block_id = b.id
    LEFT JOIN users u ON a.owner_user_id = u.id
    WHERE u.full_name LIKE '%Elif%' AND u.full_name LIKE '%Kılıç%'
""")

elif_apartments = cursor.fetchall()
if elif_apartments:
    print(f"✅ Found Elif Kılıç in {len(elif_apartments)} apartment(s):")
    for apt in elif_apartments:
        apt_id, block, unit, owner_id, owner_name = apt
        print(f"   - {block} - Daire {unit}: {owner_name}")
        
        # Remove Elif Kılıç from this apartment
        cursor.execute("""
            UPDATE apartments 
            SET owner_user_id = NULL, current_resident_id = NULL
            WHERE id = %s
        """, (apt_id,))
        print(f"   ✅ Removed Elif Kılıç from {block} - Daire {unit}")
else:
    print("✅ No Elif Kılıç found in apartments")

conn.commit()

# 5. Verify final state
print(f"\n5. Verifying final state...")

# Check A Blok Daire 12
cursor.execute("""
    SELECT u.full_name FROM apartments a
    JOIN users u ON a.owner_user_id = u.id
    JOIN blocks b ON a.block_id = b.id
    WHERE b.name = 'A Blok' AND a.unit_number = '12'
""")

a12_owner = cursor.fetchone()
if a12_owner:
    print(f"✅ A Blok Daire 12 owner: {a12_owner[0]}")
else:
    print("❌ A Blok Daire 12 has no owner")

# Check B Blok Daire 36
cursor.execute("""
    SELECT u.full_name FROM apartments a
    JOIN users u ON a.owner_user_id = u.id
    JOIN blocks b ON a.block_id = b.id
    WHERE b.name = 'B Blok' AND a.unit_number = '36'
""")

b36_owner = cursor.fetchone()
if b36_owner:
    print(f"✅ B Blok Daire 36 owner: {b36_owner[0]}")
else:
    print("❌ B Blok Daire 36 has no owner")

# Check if Ali Doğan or Elif Kılıç still exist in any apartment
cursor.execute("""
    SELECT COUNT(*) FROM apartments a
    JOIN users u ON (a.owner_user_id = u.id OR a.current_resident_id = u.id)
    WHERE (u.full_name LIKE '%Ali%' AND u.full_name LIKE '%Doğan%')
       OR (u.full_name LIKE '%Elif%' AND u.full_name LIKE '%Kılıç%')
""")

remaining_count = cursor.fetchone()[0]
if remaining_count == 0:
    print("✅ No Ali Doğan or Elif Kılıç found in any apartment")
else:
    print(f"⚠️  Still {remaining_count} Ali Doğan/Elif Kılıç found in apartments")

cursor.close()
conn.close()

print("\n" + "=" * 80)
print("REPLACEMENT COMPLETED")
print("=" * 80)