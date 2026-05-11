#!/usr/bin/env python3
"""
Check all apartment residents from database directly
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
print("CHECKING ALL APARTMENT RESIDENTS FROM DATABASE")
print("=" * 80)

# Get all apartments with residents
cursor.execute("""
    SELECT b.name, a.unit_number, u.full_name, u.email, u.phone, rh.is_owner, a.id as apartment_id
    FROM apartments a
    JOIN blocks b ON a.block_id = b.id
    JOIN residency_history rh ON a.id = rh.apartment_id 
    JOIN users u ON rh.user_id = u.id
    WHERE b.site_id = 1 
      AND rh.status = 'active' 
      AND rh.is_deleted = FALSE
      AND u.is_deleted = FALSE
    ORDER BY b.name, CAST(a.unit_number AS UNSIGNED), rh.is_owner DESC
""")

residents_data = cursor.fetchall()

if residents_data:
    print(f"✅ Found {len(residents_data)} resident records:")
    
    current_apartment = None
    
    for resident in residents_data:
        block, unit, name, email, phone, is_owner, apt_id = resident
        apartment_key = f"{block} - Daire {unit}"
        
        if apartment_key != current_apartment:
            current_apartment = apartment_key
            print(f"\n📍 {apartment_key} (ID: {apt_id}):")
        
        role = "Malik" if is_owner else "Kiracı"
        role_emoji = "👑" if is_owner else "🏠"
        
        print(f"   {role_emoji} {name}")
        print(f"      📧 {email}")
        if phone:
            print(f"      📞 {phone}")
        print(f"      🏷️  {role}")
        
else:
    print("❌ No residents found")

# Check if there are any residents with issues
print(f"\n" + "=" * 50)
print("CHECKING FOR POTENTIAL ISSUES")
print("=" * 50)

# Check users without active residency
cursor.execute("""
    SELECT u.full_name, u.email, u.status
    FROM users u
    LEFT JOIN residency_history rh ON u.id = rh.user_id 
                                   AND rh.status = 'active' 
                                   AND rh.is_deleted = FALSE
    WHERE u.full_name LIKE '%Ali%' OR u.full_name LIKE '%Elif%'
      AND u.is_deleted = FALSE
    ORDER BY u.full_name
""")

users_without_residency = cursor.fetchall()
if users_without_residency:
    print(f"\n🔍 Users with Ali/Elif in name:")
    for user in users_without_residency:
        name, email, status = user
        print(f"   - {name} ({email}) - Status: {status}")
        
        # Check if they have any residency
        cursor.execute("""
            SELECT COUNT(*) FROM residency_history rh
            WHERE rh.user_id = (SELECT id FROM users WHERE email = %s)
              AND rh.status = 'active' AND rh.is_deleted = FALSE
        """, (email,))
        
        active_count = cursor.fetchone()[0]
        if active_count > 0:
            print(f"     ✅ Has {active_count} active residency")
        else:
            print(f"     ❌ No active residency")

cursor.close()
conn.close()

print("\n" + "=" * 80)
print("ALL APARTMENT RESIDENTS CHECK COMPLETED")
print("=" * 80)