#!/usr/bin/env python3
"""
Cleanup Yeşilvadi admins - keep only admin@site.com
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

print("=== Cleaning up Yeşilvadi Admin Users ===\n")

# Get Yeşilvadi site ID
cursor.execute("SELECT id, name FROM sites WHERE id = '1'")
yesilvadi = cursor.fetchone()

if not yesilvadi:
    print("❌ Yeşilvadi sitesi bulunamadı")
    exit(1)

site_id = yesilvadi['id']
site_name = yesilvadi['name']

print(f"Site: {site_name} (ID: {site_id})\n")

# Get ROLE_ADMIN role ID
cursor.execute("SELECT id FROM roles WHERE name = 'ROLE_ADMIN'")
role_result = cursor.fetchone()
admin_role_id = role_result['id']

# Find all admin users for Yeşilvadi
cursor.execute("""
    SELECT 
        u.id as user_id,
        u.email,
        u.full_name
    FROM users u
    INNER JOIN user_roles ur ON u.id = ur.user_id
    WHERE ur.role_id = %s AND u.site_id = %s AND u.is_deleted = 0
    ORDER BY u.email
""", (admin_role_id, site_id))

admins = cursor.fetchall()

print(f"Found {len(admins)} admin users for Yeşilvadi:\n")
for admin in admins:
    print(f"  - {admin['email']} ({admin['full_name']})")

print("\n" + "="*60)

# Keep only admin@site.com, delete others
for admin in admins:
    email = admin['email']
    user_id = admin['user_id']
    
    if email == 'admin@site.com':
        print(f"✓ Keeping: {email}")
        
        # Make sure this user has yonetici membership
        cursor.execute("""
            SELECT id FROM user_site_memberships
            WHERE user_id = %s AND site_id = %s
        """, (user_id, site_id))
        
        membership = cursor.fetchone()
        
        if membership:
            cursor.execute("""
                UPDATE user_site_memberships
                SET role_type = 'yonetici', status = 'aktif', updated_at = NOW()
                WHERE user_id = %s AND site_id = %s
            """, (user_id, site_id))
            print(f"  ✓ Updated membership to 'yonetici'")
        else:
            import uuid
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
            print(f"  ✓ Created 'yonetici' membership")
        
        conn.commit()
    else:
        print(f"✗ Deleting: {email}")
        
        # Delete user_site_memberships
        cursor.execute("""
            DELETE FROM user_site_memberships
            WHERE user_id = %s
        """, (user_id,))
        
        # Delete site_memberships
        cursor.execute("""
            DELETE FROM site_memberships
            WHERE user_id = %s
        """, (user_id,))
        
        # Delete user_roles
        cursor.execute("""
            DELETE FROM user_roles
            WHERE user_id = %s
        """, (user_id,))
        
        # Delete user
        cursor.execute("""
            DELETE FROM users
            WHERE id = %s
        """, (user_id,))
        
        conn.commit()
        print(f"  ✓ Deleted user and all related records")

print("\n" + "="*60)
print("VERIFICATION")
print("="*60 + "\n")

# Verify only admin@site.com remains
cursor.execute("""
    SELECT 
        u.email,
        u.full_name,
        usm.role_type
    FROM users u
    INNER JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN user_site_memberships usm ON u.id = usm.user_id AND usm.site_id = u.site_id
    WHERE ur.role_id = %s AND u.site_id = %s AND u.is_deleted = 0
""", (admin_role_id, site_id))

remaining_admins = cursor.fetchall()

print(f"Remaining admin users for Yeşilvadi: {len(remaining_admins)}\n")
for admin in remaining_admins:
    print(f"  Email: {admin['email']}")
    print(f"  Name: {admin['full_name']}")
    print(f"  Role Type: {admin['role_type']}")

print("\n✓ Cleanup complete!")
print("Only admin@site.com remains for Yeşilvadi sitesi")

cursor.close()
conn.close()
