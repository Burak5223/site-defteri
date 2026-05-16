#!/usr/bin/env python3
"""
Check existing residents in Yeşilvadi site
"""
import mysql.connector

connection = mysql.connector.connect(
    host='localhost',
    database='smart_site_management',
    user='root',
    password='Hilton5252.'
)

cursor = connection.cursor(dictionary=True)

print("=== Checking Yeşilvadi Residents ===\n")

# Get Yeşilvadi site ID
cursor.execute("SELECT id, name FROM sites WHERE name LIKE '%Yeşil%'")
yesilvadi = cursor.fetchone()

if not yesilvadi:
    print("❌ Yeşilvadi site not found!")
    cursor.close()
    connection.close()
    exit(1)

site_id = yesilvadi['id']
site_name = yesilvadi['name']

print(f"Site: {site_name} (ID: {site_id})\n")

# Get residents from user_site_memberships
cursor.execute("""
    SELECT 
        u.id, 
        u.email, 
        u.full_name, 
        u.phone,
        usm.role_type,
        usm.status
    FROM users u
    JOIN user_site_memberships usm ON u.id = usm.user_id
    WHERE usm.site_id = %s 
      AND usm.role_type = 'sakin'
      AND usm.is_deleted = 0
    ORDER BY u.full_name
""", (site_id,))

residents = cursor.fetchall()

print(f"Found {len(residents)} resident(s):\n")
print(f"{'ID':<40} {'Name':<30} {'Email':<30} {'Phone':<15} {'Status'}")
print("=" * 145)

for resident in residents:
    print(f"{resident['id']:<40} {resident['full_name']:<30} {resident['email']:<30} {resident['phone'] or 'N/A':<15} {resident['status']}")

cursor.close()
connection.close()

print(f"\n✓ Check complete!")
