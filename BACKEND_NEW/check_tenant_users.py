#!/usr/bin/env python3
"""
Check tenant users in A Blok 12 and B Blok 36
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
print("CHECKING TENANT USERS IN TARGET APARTMENTS")
print("=" * 80)

# Check current residents (tenants) in A Blok 12 and B Blok 36
cursor.execute("""
    SELECT 
        a.id as apartment_id,
        b.name as block_name,
        a.unit_number,
        a.current_resident_id,
        tenant.full_name as tenant_name,
        tenant.email as tenant_email
    FROM apartments a
    JOIN blocks b ON a.block_id = b.id
    LEFT JOIN users tenant ON a.current_resident_id = tenant.id
    WHERE (b.name = 'A Blok' AND a.unit_number = '12')
       OR (b.name = 'B Blok' AND a.unit_number = '36')
    ORDER BY b.name, a.unit_number
""")

apartments = cursor.fetchall()
print("📍 Current tenants in target apartments:")
for apt in apartments:
    apt_id, block, unit, tenant_id, tenant_name, tenant_email = apt
    print(f"   {block} Daire {unit}: {tenant_name or 'None'} ({tenant_email or 'None'})")

# The user wants Sakin User to replace the tenants too, not just be the owner
print(f"\n🔄 User wants Sakin User to be both owner AND resident in these apartments")
print(f"   This means Sakin User should replace the current tenants")

# Get Sakin User ID
cursor.execute("SELECT id FROM users WHERE email = 'sakin@site.com'")
sakin_result = cursor.fetchone()
if sakin_result:
    sakin_user_id = sakin_result[0]
    print(f"   Sakin User ID: {sakin_user_id}")
    
    # Update current_resident_id to Sakin User for both apartments
    print(f"\n🔧 Updating current residents to Sakin User...")
    
    # A Blok Daire 12
    cursor.execute("""
        UPDATE apartments a
        JOIN blocks b ON a.block_id = b.id
        SET a.current_resident_id = %s
        WHERE b.name = 'A Blok' AND a.unit_number = '12'
    """, (sakin_user_id,))
    print(f"   ✅ Updated A Blok Daire 12 resident to Sakin User")
    
    # B Blok Daire 36
    cursor.execute("""
        UPDATE apartments a
        JOIN blocks b ON a.block_id = b.id
        SET a.current_resident_id = %s
        WHERE b.name = 'B Blok' AND a.unit_number = '36'
    """, (sakin_user_id,))
    print(f"   ✅ Updated B Blok Daire 36 resident to Sakin User")
    
    conn.commit()
    
    # Verify the changes
    print(f"\n✅ Verification:")
    cursor.execute("""
        SELECT 
            b.name as block_name,
            a.unit_number,
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
    
    final_state = cursor.fetchall()
    for apt in final_state:
        block, unit, owner_name, resident_name = apt
        print(f"   {block} Daire {unit}: Owner={owner_name}, Resident={resident_name}")

cursor.close()
conn.close()

print("\n" + "=" * 80)
print("TENANT UPDATE COMPLETED")
print("=" * 80)