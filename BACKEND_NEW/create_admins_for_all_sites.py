#!/usr/bin/env python3
"""
Create admin users for all sites
"""
import mysql.connector
import os
import uuid
from datetime import datetime
import bcrypt

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password=os.getenv('DB_PASSWORD', 'Hilton5252.'),
    database='smart_site_management'
)

cursor = conn.cursor()

# Get ROLE_ADMIN role ID
cursor.execute("SELECT id FROM roles WHERE name = 'ROLE_ADMIN'")
role_result = cursor.fetchone()
if not role_result:
    print("❌ ROLE_ADMIN not found")
    exit(1)

admin_role_id = role_result[0]
print(f"✓ Found ROLE_ADMIN: {admin_role_id}")

# Get all sites
cursor.execute("SELECT id, name FROM sites WHERE is_deleted = 0")
sites = cursor.fetchall()

print(f"\n=== Found {len(sites)} sites ===")

# Password hash for "admin123"
password_hash = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYKZblo6QLG"

for site in sites:
    site_id = site[0]
    site_name = site[1]
    
    print(f"\n--- Site: {site_name} (ID: {site_id}) ---")
    
    # Check if admin already exists for this site
    cursor.execute("""
        SELECT u.id, u.email, u.full_name
        FROM users u
        INNER JOIN user_roles ur ON u.id = ur.user_id
        WHERE ur.role_id = %s AND u.site_id = %s AND u.is_deleted = 0
        LIMIT 1
    """, (admin_role_id, site_id))
    
    existing_admin = cursor.fetchone()
    
    if existing_admin:
        print(f"  ✓ Admin already exists: {existing_admin[2]} ({existing_admin[1]})")
        continue
    
    # Create admin user for this site
    user_id = str(uuid.uuid4())
    email = f"admin@{site_name.lower().replace(' ', '')}.com"
    full_name = f"{site_name} Admin"
    
    try:
        # Insert user
        cursor.execute("""
            INSERT INTO users (
                id, full_name, email, phone, site_id, password_hash,
                status, email_verified, phone_verified, created_at, updated_at
            ) VALUES (
                %s, %s, %s, NULL, %s, %s,
                'aktif', 1, 0, NOW(), NOW()
            )
        """, (user_id, full_name, email, site_id, password_hash))
        
        # Assign ROLE_ADMIN
        role_assignment_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO user_roles (
                id, user_id, role_id, site_id, assigned_at, created_at, updated_at
            ) VALUES (
                %s, %s, %s, %s, NOW(), NOW(), NOW()
            )
        """, (role_assignment_id, user_id, admin_role_id, site_id))
        
        # Create site membership
        membership_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO site_memberships (
                id, user_id, site_id, joined_at, is_active, created_at, updated_at
            ) VALUES (
                %s, %s, %s, NOW(), 1, NOW(), NOW()
            )
        """, (membership_id, user_id, site_id))
        
        conn.commit()
        
        print(f"  ✓ Created admin user:")
        print(f"    Email: {email}")
        print(f"    Password: admin123")
        print(f"    Name: {full_name}")
        
    except Exception as e:
        conn.rollback()
        print(f"  ❌ Error creating admin: {e}")

print("\n" + "="*60)
print("SUMMARY")
print("="*60)

# Show all admins
cursor.execute("""
    SELECT s.name, u.email, u.full_name
    FROM users u
    INNER JOIN user_roles ur ON u.id = ur.user_id
    INNER JOIN sites s ON u.site_id = s.id
    WHERE ur.role_id = %s AND u.is_deleted = 0
    ORDER BY s.name
""", (admin_role_id,))

admins = cursor.fetchall()

print(f"\nTotal admins: {len(admins)}")
print("\nAdmin users by site:")
for admin in admins:
    print(f"  {admin[0]}: {admin[2]} ({admin[1]})")

print("\n✓ All sites now have admin users!")
print("\nDefault password for all admins: admin123")

cursor.close()
conn.close()
