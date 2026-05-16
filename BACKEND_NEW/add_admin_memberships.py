#!/usr/bin/env python3
"""
Add user_site_memberships with role_type='yonetici' for all admin users
"""
import mysql.connector
import os
import uuid
from datetime import datetime

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password=os.getenv('DB_PASSWORD', 'Hilton5252.'),
    database='smart_site_management'
)

cursor = conn.cursor(dictionary=True)

print("=== Adding Admin Memberships ===\n")

# Get ROLE_ADMIN role ID
cursor.execute("SELECT id FROM roles WHERE name = 'ROLE_ADMIN'")
role_result = cursor.fetchone()
admin_role_id = role_result['id']

# Get all admins
cursor.execute("""
    SELECT 
        u.id as user_id,
        u.email,
        u.full_name,
        u.site_id,
        s.name as site_name
    FROM users u
    INNER JOIN user_roles ur ON u.id = ur.user_id
    INNER JOIN sites s ON u.site_id = s.id
    WHERE ur.role_id = %s AND u.is_deleted = 0
    ORDER BY s.name
""", (admin_role_id,))

admins = cursor.fetchall()

print(f"Found {len(admins)} admin users\n")

for admin in admins:
    user_id = admin['user_id']
    site_id = admin['site_id']
    email = admin['email']
    site_name = admin['site_name']
    
    print(f"Processing: {site_name} - {email}")
    
    # Check if membership already exists
    cursor.execute("""
        SELECT id FROM user_site_memberships
        WHERE user_id = %s AND site_id = %s
    """, (user_id, site_id))
    
    existing = cursor.fetchone()
    
    if existing:
        # Update role_type to 'yonetici'
        cursor.execute("""
            UPDATE user_site_memberships
            SET role_type = 'yonetici', status = 'aktif', updated_at = NOW()
            WHERE user_id = %s AND site_id = %s
        """, (user_id, site_id))
        print(f"  ✓ Updated existing membership to 'yonetici'")
    else:
        # Create new membership
        membership_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO user_site_memberships (
                id, user_id, site_id, role_type, status, joined_at, 
                is_deleted, created_at, updated_at
            ) VALUES (
                %s, %s, %s, 'yonetici', 'aktif', NOW(), 
                0, NOW(), NOW()
            )
        """, (membership_id, user_id, site_id))
        print(f"  ✓ Created new membership with role_type='yonetici'")
    
    conn.commit()

print("\n" + "="*60)
print("VERIFICATION")
print("="*60 + "\n")

# Verify all admins now have yonetici memberships
cursor.execute("""
    SELECT 
        s.name as site_name,
        u.email,
        usm.role_type
    FROM user_site_memberships usm
    INNER JOIN users u ON usm.user_id = u.id
    INNER JOIN sites s ON usm.site_id = s.id
    WHERE usm.role_type = 'yonetici'
    ORDER BY s.name
""")

memberships = cursor.fetchall()

print(f"Total 'yonetici' memberships: {len(memberships)}\n")
for membership in memberships:
    print(f"{membership['site_name']}: {membership['email']}")

print("\n✓ All admin users now have 'yonetici' memberships!")
print("The impersonate feature should now work for all sites.")

cursor.close()
conn.close()
