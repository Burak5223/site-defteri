#!/usr/bin/env python3
"""
Add more test residents to other apartments for better testing
"""
import mysql.connector
import uuid
from datetime import datetime

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

print("=" * 80)
print("ADDING MORE TEST RESIDENTS")
print("=" * 80)

# Test residents to add
test_residents = [
    {
        "name": "Ali Doğan",
        "email": "ali.dogan@yesilvadi.com",
        "phone": "5551234501",
        "block": "A Blok",
        "unit": "1",
        "is_owner": True
    },
    {
        "name": "Elif Kılıç",
        "email": "elif.kilic@yesilvadi.com", 
        "phone": "5551234502",
        "block": "A Blok",
        "unit": "1",
        "is_owner": False
    },
    {
        "name": "Mehmet Yılmaz",
        "email": "mehmet.yilmaz@yesilvadi.com",
        "phone": "5551234503", 
        "block": "A Blok",
        "unit": "2",
        "is_owner": True
    },
    {
        "name": "Ayşe Demir",
        "email": "ayse.demir@yesilvadi.com",
        "phone": "5551234504",
        "block": "B Blok", 
        "unit": "1",
        "is_owner": True
    },
    {
        "name": "Fatma Özkan",
        "email": "fatma.ozkan@yesilvadi.com",
        "phone": "5551234505",
        "block": "B Blok",
        "unit": "2", 
        "is_owner": False
    }
]

for resident in test_residents:
    print(f"\n1. Adding {resident['name']} to {resident['block']} Daire {resident['unit']}...")
    
    # Get apartment ID
    cursor.execute("""
        SELECT a.id FROM apartments a
        JOIN blocks b ON a.block_id = b.id
        WHERE b.name = %s AND a.unit_number = %s
        LIMIT 1
    """, (resident['block'], resident['unit']))
    
    apt_result = cursor.fetchone()
    if not apt_result:
        print(f"❌ {resident['block']} Daire {resident['unit']} not found")
        continue
        
    apartment_id = apt_result[0]
    print(f"✅ Found apartment ID: {apartment_id}")
    
    # Check if user already exists
    cursor.execute("SELECT id FROM users WHERE email = %s", (resident['email'],))
    user_result = cursor.fetchone()
    
    if user_result:
        user_id = user_result[0]
        print(f"✅ User already exists: {user_id}")
    else:
        # Create user
        user_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO users (id, full_name, email, phone, password_hash, status, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, 'aktif', NOW(), NOW())
        """, (user_id, resident['name'], resident['email'], resident['phone'], "$2a$10$dummy.hash.for.testing"))
        print(f"✅ Created user: {user_id}")
    
    # Check if residency already exists
    cursor.execute("""
        SELECT id FROM residency_history 
        WHERE user_id = %s AND apartment_id = %s AND status = 'active' AND is_deleted = FALSE
    """, (user_id, apartment_id))
    
    residency_result = cursor.fetchone()
    if residency_result:
        print(f"✅ Residency already exists")
    else:
        # Add residency
        residency_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO residency_history 
            (id, apartment_id, user_id, is_owner, move_in_date, status, created_at, updated_at, is_deleted)
            VALUES (%s, %s, %s, %s, %s, 'active', NOW(), NOW(), FALSE)
        """, (residency_id, apartment_id, user_id, resident['is_owner'], datetime.now().date()))
        print(f"✅ Added residency: {residency_id}")
    
    # Check if site membership exists
    cursor.execute("""
        SELECT id FROM user_site_memberships 
        WHERE user_id = %s AND site_id = '1' AND status = 'aktif'
    """, (user_id,))
    
    membership_result = cursor.fetchone()
    if membership_result:
        print(f"✅ Site membership already exists")
    else:
        # Add site membership
        membership_id = str(uuid.uuid4())
        user_type = 'kat_maliki' if resident['is_owner'] else 'kiraci'
        cursor.execute("""
            INSERT INTO user_site_memberships 
            (id, user_id, site_id, role_type, user_type, status, joined_at, created_at, updated_at)
            VALUES (%s, %s, '1', 'sakin', %s, 'aktif', %s, NOW(), NOW())
        """, (membership_id, user_id, user_type, datetime.now().date()))
        print(f"✅ Added site membership: {membership_id}")

conn.commit()

# Verify all apartments with residents
print(f"\n2. Verifying all apartments with residents...")
cursor.execute("""
    SELECT DISTINCT b.name, a.unit_number, COUNT(rh.user_id) as resident_count
    FROM apartments a
    JOIN blocks b ON a.block_id = b.id
    LEFT JOIN residency_history rh ON a.id = rh.apartment_id 
                                   AND rh.status = 'active' 
                                   AND rh.is_deleted = FALSE
    WHERE b.site_id = 1
    GROUP BY a.id, b.name, a.unit_number
    HAVING resident_count > 0
    ORDER BY b.name, CAST(a.unit_number AS UNSIGNED)
""")

apartments_with_residents = cursor.fetchall()
print(f"✅ Found {len(apartments_with_residents)} apartments with residents:")
for apt in apartments_with_residents:
    block, unit, count = apt
    print(f"   - {block} - {unit}: {count} resident(s)")

cursor.close()
conn.close()

print("\n" + "=" * 80)
print("MORE TEST RESIDENTS ADDED SUCCESSFULLY")
print("=" * 80)