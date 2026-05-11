#!/usr/bin/env python3
"""
Check why Ali Doğan still appears in residents
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
print("CHECKING ALI DOĞAN ISSUE")
print("=" * 80)

# 1. Check if Ali Doğan exists in database
print("\n1. Checking Ali Doğan in database...")
cursor.execute("""
    SELECT id, full_name, email, status
    FROM users 
    WHERE full_name LIKE '%Ali%' AND full_name LIKE '%Doğan%'
""")

ali_users = cursor.fetchall()
if ali_users:
    print(f"✅ Found {len(ali_users)} Ali Doğan user(s):")
    for user in ali_users:
        user_id, name, email, status = user
        print(f"   - {name} ({email}) - Status: {status}")
        print(f"     User ID: {user_id}")
        
        # Check residency for this user
        print(f"\n   Checking residency for {name}:")
        cursor.execute("""
            SELECT b.name, a.unit_number, rh.is_owner, rh.status, rh.is_deleted
            FROM residency_history rh
            JOIN apartments a ON rh.apartment_id = a.id
            JOIN blocks b ON a.block_id = b.id
            WHERE rh.user_id = %s
            ORDER BY rh.status DESC, b.name, a.unit_number
        """, (user_id,))
        
        residencies = cursor.fetchall()
        if residencies:
            for res in residencies:
                block, unit, is_owner, status, is_deleted = res
                role = "Malik" if is_owner else "Kiracı"
                deleted_status = "DELETED" if is_deleted else "ACTIVE"
                print(f"     - {block} - {unit} ({role}) - Status: {status} - {deleted_status}")
        else:
            print(f"     ❌ No residency found for {name}")
else:
    print("❌ No Ali Doğan found in database")

# 2. Check all users with "Ali" in name
print("\n2. Checking all users with 'Ali' in name...")
cursor.execute("""
    SELECT id, full_name, email, status
    FROM users 
    WHERE full_name LIKE '%Ali%'
    ORDER BY full_name
""")

ali_all_users = cursor.fetchall()
if ali_all_users:
    print(f"✅ Found {len(ali_all_users)} user(s) with 'Ali':")
    for user in ali_all_users:
        user_id, name, email, status = user
        print(f"   - {name} ({email}) - Status: {status}")
        
        # Check if this user has active residency
        cursor.execute("""
            SELECT COUNT(*) FROM residency_history rh
            WHERE rh.user_id = %s AND rh.status = 'active' AND rh.is_deleted = FALSE
        """, (user_id,))
        
        active_count = cursor.fetchone()[0]
        if active_count > 0:
            print(f"     ⚠️  HAS {active_count} ACTIVE RESIDENCY!")
        else:
            print(f"     ✅ No active residency")

# 3. Check Daire 12 specifically
print("\n3. Checking Daire 12 residents...")
cursor.execute("""
    SELECT u.id, u.full_name, u.email, rh.is_owner, rh.status, rh.is_deleted
    FROM users u
    JOIN residency_history rh ON u.id = rh.user_id
    JOIN apartments a ON rh.apartment_id = a.id
    JOIN blocks b ON a.block_id = b.id
    WHERE b.name = 'A Blok' AND a.unit_number = '12'
    ORDER BY rh.status DESC, u.full_name
""")

daire_12_residents = cursor.fetchall()
if daire_12_residents:
    print(f"✅ Found {len(daire_12_residents)} record(s) for Daire 12:")
    for resident in daire_12_residents:
        user_id, name, email, is_owner, status, is_deleted = resident
        role = "Malik" if is_owner else "Kiracı"
        deleted_status = "DELETED" if is_deleted else "ACTIVE"
        print(f"   - {name} ({email}) - {role} - Status: {status} - {deleted_status}")
        
        # Check if this should appear in API
        should_appear = status == 'active' and not is_deleted
        print(f"     Should appear in API: {should_appear}")
else:
    print("❌ No residents found for Daire 12")

# 4. Check what the API query returns for Daire 12
print("\n4. Checking API query for Daire 12...")
cursor.execute("""
    SELECT a.id FROM apartments a
    JOIN blocks b ON a.block_id = b.id
    WHERE b.name = 'A Blok' AND a.unit_number = '12'
    LIMIT 1
""")

daire_12_result = cursor.fetchone()
if daire_12_result:
    daire_12_id = daire_12_result[0]
    print(f"✅ Daire 12 ID: {daire_12_id}")
    
    # Run the exact query that UserRepository.findByApartmentId uses
    cursor.execute("""
        SELECT DISTINCT u.id, u.full_name, u.email FROM users u 
        JOIN residency_history rh ON u.id = rh.user_id 
        WHERE rh.apartment_id = %s 
        AND rh.status = 'active' 
        AND rh.is_deleted = FALSE
    """, (daire_12_id,))
    
    api_residents = cursor.fetchall()
    print(f"✅ API query returns {len(api_residents)} resident(s):")
    for resident in api_residents:
        user_id, name, email = resident
        print(f"   - {name} ({email})")
else:
    print("❌ Daire 12 not found")

cursor.close()
conn.close()

print("\n" + "=" * 80)
print("ALI DOĞAN CHECK COMPLETED")
print("=" * 80)