#!/usr/bin/env python3
"""
Check active Ali and Elif residents and their apartments
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
print("CHECKING ACTIVE ALI AND ELIF RESIDENTS")
print("=" * 80)

# Get Ali and Elif users with active residency
active_users = [
    "ali.aydın33@yesilvadi.com",
    "ali.polat94@yesilvadi.com", 
    "sakin1@şehirmerkeziresidence.com",
    "ali.yılmaz48@yesilvadi.com",
    "elif.aslan76@yesilvadi.com"
]

for email in active_users:
    print(f"\n🔍 Checking {email}...")
    
    # Get user details and their apartment
    cursor.execute("""
        SELECT u.id, u.full_name, u.email, u.phone, u.status,
               b.name as block_name, a.unit_number, rh.is_owner
        FROM users u
        JOIN residency_history rh ON u.id = rh.user_id
        JOIN apartments a ON rh.apartment_id = a.id
        JOIN blocks b ON a.block_id = b.id
        WHERE u.email = %s 
          AND rh.status = 'active' 
          AND rh.is_deleted = FALSE
          AND u.is_deleted = FALSE
    """, (email,))
    
    result = cursor.fetchone()
    
    if result:
        user_id, name, email, phone, status, block, unit, is_owner = result
        role = "Malik" if is_owner else "Kiracı"
        role_emoji = "👑" if is_owner else "🏠"
        
        print(f"   ✅ {name}")
        print(f"      📧 {email}")
        if phone:
            print(f"      📞 {phone}")
        print(f"      🏠 {block} - Daire {unit}")
        print(f"      {role_emoji} {role}")
        print(f"      📊 Status: {status}")
    else:
        print(f"   ❌ No active residency found")

# Now let's see all apartments with their residents
print(f"\n" + "=" * 50)
print("ALL APARTMENTS WITH RESIDENTS")
print("=" * 50)

cursor.execute("""
    SELECT b.name, a.unit_number, 
           GROUP_CONCAT(CONCAT(u.full_name, ' (', 
                              CASE WHEN rh.is_owner THEN 'Malik' ELSE 'Kiracı' END, 
                              ')') SEPARATOR ', ') as residents,
           a.id as apartment_id
    FROM apartments a
    JOIN blocks b ON a.block_id = b.id
    LEFT JOIN residency_history rh ON a.id = rh.apartment_id 
                                   AND rh.status = 'active' 
                                   AND rh.is_deleted = FALSE
    LEFT JOIN users u ON rh.user_id = u.id AND u.is_deleted = FALSE
    WHERE b.site_id = 1
    GROUP BY a.id, b.name, a.unit_number
    HAVING residents IS NOT NULL
    ORDER BY b.name, CAST(a.unit_number AS UNSIGNED)
""")

apartments = cursor.fetchall()

if apartments:
    print(f"\n✅ Found {len(apartments)} apartments with residents:")
    for apt in apartments:
        block, unit, residents, apt_id = apt
        print(f"\n📍 {block} - Daire {unit} (ID: {apt_id})")
        print(f"   👥 {residents}")
else:
    print("\n❌ No apartments with residents found")

cursor.close()
conn.close()

print("\n" + "=" * 80)
print("ACTIVE ALI AND ELIF RESIDENTS CHECK COMPLETED")
print("=" * 80)