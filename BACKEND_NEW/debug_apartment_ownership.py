#!/usr/bin/env python3
"""
Debug apartment ownership after replacement
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
print("DEBUGGING APARTMENT OWNERSHIP")
print("=" * 80)

# Check A Blok Daire 12 and B Blok Daire 36
cursor.execute("""
    SELECT 
        a.id as apartment_id,
        b.name as block_name,
        a.unit_number,
        a.owner_user_id,
        a.current_resident_id,
        owner.full_name as owner_name,
        resident.full_name as resident_name
    FROM apartments a
    JOIN blocks b ON a.block_id = b.id
    LEFT JOIN users owner ON a.owner_user_id = owner.id
    LEFT JOIN users resident ON a.current_resident_id = resident.id
    WHERE (b.name = 'A Blok' AND a.unit_number = '12')
       OR (b.name = 'B Blok' AND a.unit_number = '36')
    ORDER BY b.name, a.unit_number
""")

apartments = cursor.fetchall()
print("📍 Apartment ownership status:")
for apt in apartments:
    apt_id, block, unit, owner_id, resident_id, owner_name, resident_name = apt
    print(f"   {block} Daire {unit}:")
    print(f"     Owner: {owner_name or 'None'} (ID: {owner_id or 'None'})")
    print(f"     Resident: {resident_name or 'None'} (ID: {resident_id or 'None'})")

# Check residency_history for these apartments
print(f"\n📋 Residency history for these apartments:")
cursor.execute("""
    SELECT 
        a.id as apartment_id,
        b.name as block_name,
        a.unit_number,
        rh.user_id,
        u.full_name,
        rh.is_owner,
        rh.status,
        rh.is_deleted
    FROM apartments a
    JOIN blocks b ON a.block_id = b.id
    JOIN residency_history rh ON a.id = rh.apartment_id
    JOIN users u ON rh.user_id = u.id
    WHERE (b.name = 'A Blok' AND a.unit_number = '12')
       OR (b.name = 'B Blok' AND a.unit_number = '36')
    ORDER BY b.name, a.unit_number, rh.is_owner DESC
""")

history = cursor.fetchall()
for hist in history:
    apt_id, block, unit, user_id, full_name, is_owner, status, is_deleted = hist
    role = "Owner" if is_owner else "Tenant"
    print(f"   {block} Daire {unit}: {full_name} ({role}) - Status: {status}, Deleted: {is_deleted}")

# Check Sakin User specifically
print(f"\n👤 Sakin User details:")
cursor.execute("SELECT id, full_name, email FROM users WHERE email = 'sakin@site.com'")
sakin = cursor.fetchone()
if sakin:
    sakin_id, name, email = sakin
    print(f"   ID: {sakin_id}")
    print(f"   Name: {name}")
    print(f"   Email: {email}")
    
    # Check where Sakin User is assigned
    cursor.execute("""
        SELECT 
            a.id as apartment_id,
            b.name as block_name,
            a.unit_number,
            'owner' as role_type
        FROM apartments a
        JOIN blocks b ON a.block_id = b.id
        WHERE a.owner_user_id = %s
        
        UNION ALL
        
        SELECT 
            a.id as apartment_id,
            b.name as block_name,
            a.unit_number,
            'resident' as role_type
        FROM apartments a
        JOIN blocks b ON a.block_id = b.id
        WHERE a.current_resident_id = %s
    """, (sakin_id, sakin_id))
    
    sakin_apartments = cursor.fetchall()
    print(f"   Assigned to {len(sakin_apartments)} apartment(s):")
    for apt in sakin_apartments:
        apt_id, block, unit, role = apt
        print(f"     {block} Daire {unit} as {role}")

cursor.close()
conn.close()

print("\n" + "=" * 80)
print("DEBUG COMPLETED")
print("=" * 80)