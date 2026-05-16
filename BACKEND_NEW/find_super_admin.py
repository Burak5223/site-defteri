#!/usr/bin/env python3
"""
Find super admin user
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

print("=== Finding Super Admin User ===\n")

# Get ROLE_SUPER_ADMIN role ID
cursor.execute("SELECT id, name FROM roles WHERE name LIKE '%SUPER%'")
super_roles = cursor.fetchall()

print("Super Admin Roles:")
for role in super_roles:
    print(f"  {role['name']}: {role['id']}")

if not super_roles:
    print("  ❌ No super admin role found")
    cursor.close()
    conn.close()
    exit(1)

super_admin_role_id = super_roles[0]['id']

print(f"\nSearching for users with role: {super_roles[0]['name']}\n")

# Find users with SUPER_ADMIN role
cursor.execute("""
    SELECT 
        u.id,
        u.email,
        u.full_name,
        u.password_hash,
        u.status,
        u.is_deleted
    FROM users u
    INNER JOIN user_roles ur ON u.id = ur.user_id
    WHERE ur.role_id = %s
    ORDER BY u.email
""", (super_admin_role_id,))

super_admins = cursor.fetchall()

if super_admins:
    print(f"Found {len(super_admins)} super admin(s):\n")
    for admin in super_admins:
        print(f"Email: {admin['email']}")
        print(f"Name: {admin['full_name']}")
        print(f"Status: {admin['status']}")
        print(f"Is Deleted: {admin['is_deleted']}")
        print(f"Password Hash: {admin['password_hash'][:50]}...")
        print()
else:
    print("❌ No super admin users found")

cursor.close()
conn.close()
