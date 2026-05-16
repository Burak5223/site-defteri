#!/usr/bin/env python3
"""
Check if admin@site.com exists
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

print("=== Checking admin@site.com ===\n")

# Check if admin@site.com exists
cursor.execute("""
    SELECT 
        u.id,
        u.email,
        u.full_name,
        u.site_id,
        s.name as site_name,
        u.is_deleted
    FROM users u
    LEFT JOIN sites s ON u.site_id = s.id
    WHERE u.email = 'admin@site.com'
""")

user = cursor.fetchone()

if user:
    print(f"✓ User found:")
    print(f"  ID: {user['id']}")
    print(f"  Email: {user['email']}")
    print(f"  Name: {user['full_name']}")
    print(f"  Site ID: {user['site_id']}")
    print(f"  Site Name: {user['site_name']}")
    print(f"  Is Deleted: {user['is_deleted']}")
    
    # Check roles
    cursor.execute("""
        SELECT r.name
        FROM user_roles ur
        INNER JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = %s
    """, (user['id'],))
    
    roles = cursor.fetchall()
    print(f"\n  Roles: {', '.join([r['name'] for r in roles])}")
    
    # Check memberships
    cursor.execute("""
        SELECT role_type, status
        FROM user_site_memberships
        WHERE user_id = %s
    """, (user['id'],))
    
    memberships = cursor.fetchall()
    if memberships:
        print(f"  Memberships:")
        for m in memberships:
            print(f"    - role_type: {m['role_type']}, status: {m['status']}")
    else:
        print(f"  Memberships: None")
else:
    print("❌ admin@site.com NOT FOUND")
    print("\nNeed to create this user for Yeşilvadi sitesi")

cursor.close()
conn.close()
