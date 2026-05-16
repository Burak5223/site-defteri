#!/usr/bin/env python3
"""
Check all user_site_memberships to see what we have
"""
import mysql.connector

connection = mysql.connector.connect(
    host='localhost',
    database='smart_site_management',
    user='root',
    password='Hilton5252.'
)

cursor = connection.cursor(dictionary=True)

print("=== Checking All User Site Memberships ===\n")

# Get all memberships grouped by site and role
cursor.execute("""
    SELECT 
        s.name as site_name,
        usm.role_type,
        COUNT(*) as count
    FROM user_site_memberships usm
    JOIN sites s ON usm.site_id = s.id
    WHERE usm.is_deleted = 0
    GROUP BY s.name, usm.role_type
    ORDER BY s.name, usm.role_type
""")

memberships = cursor.fetchall()

print(f"{'Site':<40} {'Role':<20} {'Count'}")
print("=" * 70)

for m in memberships:
    print(f"{m['site_name']:<40} {m['role_type']:<20} {m['count']}")

print("\n" + "=" * 70)

# Get total counts
cursor.execute("""
    SELECT 
        role_type,
        COUNT(*) as count
    FROM user_site_memberships
    WHERE is_deleted = 0
    GROUP BY role_type
""")

totals = cursor.fetchall()

print("\nTOTAL BY ROLE:")
for t in totals:
    print(f"  {t['role_type']}: {t['count']}")

# Check if we have any users with sakin role at all
cursor.execute("""
    SELECT COUNT(*) as count
    FROM user_site_memberships
    WHERE role_type = 'sakin' AND is_deleted = 0
""")

sakin_count = cursor.fetchone()
print(f"\nTotal 'sakin' memberships: {sakin_count['count']}")

# Check users table for any residents
cursor.execute("""
    SELECT COUNT(*) as count
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE r.name = 'RESIDENT'
""")

resident_users = cursor.fetchone()
print(f"Total users with RESIDENT role: {resident_users['count']}")

cursor.close()
connection.close()

print(f"\n✓ Check complete!")
