#!/usr/bin/env python3
"""
Fix admin@site.com to have proper roles and memberships
"""
import mysql.connector
import os
import uuid

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password=os.getenv('DB_PASSWORD', 'Hilton5252.'),
    database='smart_site_management'
)

cursor = conn.cursor(dictionary=True)

print("=== Fixing admin@site.com ===\n")

# Get user
cursor.execute("""
    SELECT id, email, full_name, site_id
    FROM users
    WHERE email = 'admin@site.com' AND is_deleted = 0
""")

user = cursor.fetchone()

if not user:
    print("❌ admin@site.com not found")
    exit(1)

user_id = user['id']
site_id = user['site_id']

print(f"User: {user['email']} ({user['full_name']})")
print(f"Site ID: {site_id}\n")

# Get ROLE_ADMIN role ID
cursor.execute("SELECT id FROM roles WHERE name = 'ROLE_ADMIN'")
role_result = cursor.fetchone()
admin_role_id = role_result['id']

# Check if user has ROLE_ADMIN in user_roles
cursor.execute("""
    SELECT id FROM user_roles
    WHERE user_id = %s AND role_id = %s
""", (user_id, admin_role_id))

user_role = cursor.fetchone()

if not user_role:
    print("Adding ROLE_ADMIN to user_roles...")
    role_assignment_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO user_roles (
            id, user_id, role_id, site_id, assigned_at, created_at, updated_at
        ) VALUES (
            %s, %s, %s, %s, NOW(), NOW(), NOW()
        )
    """, (role_assignment_id, user_id, admin_role_id, site_id))
    conn.commit()
    print("✓ Added ROLE_ADMIN to user_roles")
else:
    print("✓ User already has ROLE_ADMIN in user_roles")

# Check user_site_memberships
cursor.execute("""
    SELECT id, role_type, status
    FROM user_site_memberships
    WHERE user_id = %s AND site_id = %s
""", (user_id, site_id))

membership = cursor.fetchone()

if membership:
    print(f"\nCurrent membership: role_type={membership['role_type']}, status={membership['status']}")
    
    if membership['role_type'] != 'yonetici' or membership['status'] != 'aktif':
        print("Updating membership to role_type='yonetici', status='aktif'...")
        cursor.execute("""
            UPDATE user_site_memberships
            SET role_type = 'yonetici', status = 'aktif', updated_at = NOW()
            WHERE user_id = %s AND site_id = %s
        """, (user_id, site_id))
        conn.commit()
        print("✓ Updated membership")
    else:
        print("✓ Membership already correct")
else:
    print("\nCreating user_site_membership with role_type='yonetici'...")
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
    conn.commit()
    print("✓ Created membership")

print("\n" + "="*60)
print("VERIFICATION")
print("="*60 + "\n")

# Verify final state
cursor.execute("""
    SELECT 
        u.email,
        u.full_name,
        s.name as site_name,
        usm.role_type,
        usm.status
    FROM users u
    INNER JOIN sites s ON u.site_id = s.id
    LEFT JOIN user_site_memberships usm ON u.id = usm.user_id AND usm.site_id = u.site_id
    WHERE u.email = 'admin@site.com' AND u.is_deleted = 0
""")

result = cursor.fetchone()

print(f"Email: {result['email']}")
print(f"Name: {result['full_name']}")
print(f"Site: {result['site_name']}")
print(f"Role Type: {result['role_type']}")
print(f"Status: {result['status']}")

# Check roles
cursor.execute("""
    SELECT r.name
    FROM user_roles ur
    INNER JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = %s
""", (user_id,))

roles = cursor.fetchall()
print(f"Roles: {', '.join([r['name'] for r in roles])}")

print("\n✓ admin@site.com is ready for impersonate!")

cursor.close()
conn.close()
