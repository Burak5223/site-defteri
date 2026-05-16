#!/usr/bin/env python3
"""
Verify admin users and test impersonate feature
"""
import mysql.connector
import os

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password=os.getenv('DB_PASSWORD', 'Hilton5252.'),
    database='smart_site_management'
)

cursor = conn.cursor(dictionary=True)

print("=== Checking Admin Users ===\n")

# Get ROLE_ADMIN role ID
cursor.execute("SELECT id FROM roles WHERE name = 'ROLE_ADMIN'")
role_result = cursor.fetchone()
admin_role_id = role_result['id']

# Get all admins with their sites
cursor.execute("""
    SELECT 
        u.id as user_id,
        u.email,
        u.full_name,
        u.phone,
        s.id as site_id,
        s.name as site_name,
        ur.role_id
    FROM users u
    INNER JOIN user_roles ur ON u.id = ur.user_id
    INNER JOIN sites s ON u.site_id = s.id
    WHERE ur.role_id = %s AND u.is_deleted = 0
    ORDER BY s.name
""", (admin_role_id,))

admins = cursor.fetchall()

print(f"Found {len(admins)} admin users:\n")
for admin in admins:
    print(f"Site: {admin['site_name']}")
    print(f"  User ID: {admin['user_id']}")
    print(f"  Email: {admin['email']}")
    print(f"  Name: {admin['full_name']}")
    print(f"  Phone: {admin['phone']}")
    print(f"  Site ID: {admin['site_id']}")
    print()

print("\n=== Checking user_site_memberships ===\n")

# Check if admins have memberships with role_type 'yonetici'
cursor.execute("""
    SELECT 
        usm.id,
        usm.user_id,
        usm.site_id,
        usm.role_type,
        u.email,
        s.name as site_name
    FROM user_site_memberships usm
    INNER JOIN users u ON usm.user_id = u.id
    INNER JOIN sites s ON usm.site_id = s.id
    WHERE usm.role_type = 'yonetici'
    ORDER BY s.name
""")

memberships = cursor.fetchall()

print(f"Found {len(memberships)} 'yonetici' memberships:\n")
for membership in memberships:
    print(f"Site: {membership['site_name']}")
    print(f"  Email: {membership['email']}")
    print(f"  Role Type: {membership['role_type']}")
    print()

if len(memberships) == 0:
    print("⚠️  No 'yonetici' memberships found!")
    print("This is why impersonate is failing - getAllManagers() looks for role_type='yonetici'")
    print("\nWe need to either:")
    print("1. Add user_site_memberships with role_type='yonetici' for admin users")
    print("2. Modify getAllManagers() to look for ROLE_ADMIN in user_roles table")

cursor.close()
conn.close()
