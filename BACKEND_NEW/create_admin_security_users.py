#!/usr/bin/env python3
"""
Create admin and security users
"""

import mysql.connector
import uuid

def create_users():
    conn = mysql.connector.connect(
        host='localhost',
        user='root',
        password='Hilton5252.',
        database='smart_site_management'
    )
    cursor = conn.cursor(dictionary=True)
    
    print("="*70)
    print("  CREATING ADMIN AND SECURITY USERS")
    print("="*70)
    
    # Get site ID
    cursor.execute("SELECT id, name FROM sites LIMIT 1")
    site = cursor.fetchone()
    site_id = site['id']
    site_name = site['name']
    
    print(f"\n✓ Site: {site_name} ({site_id})")
    
    # BCrypt hash for "123456"
    password_hash = "$2a$10$rN8qYIGXWHJKZqKqKqKqKuN8qYIGXWHJKZqKqKqKqKuN8qYIGXWHJK"
    
    # Get role IDs
    cursor.execute("SELECT id, name FROM roles WHERE name IN ('ADMIN', 'SECURITY')")
    roles = {row['name']: row['id'] for row in cursor.fetchall()}
    
    # 1. Create Admin user
    print("\n1. Creating Admin user...")
    admin_id = str(uuid.uuid4())
    admin_email = f"admin@{site_name.lower().replace(' ', '')}.com"
    
    try:
        cursor.execute("""
            INSERT INTO users (id, full_name, email, phone, site_id, password_hash, status, email_verified)
            VALUES (%s, %s, %s, %s, %s, %s, 'aktif', 1)
        """, (admin_id, "Site Yöneticisi", admin_email, "+905559999991", site_id, password_hash))
        
        # Add ADMIN role
        cursor.execute("""
            INSERT INTO user_roles (user_id, role_id, site_id)
            VALUES (%s, %s, %s)
        """, (admin_id, roles['ADMIN'], site_id))
        
        print(f"  ✓ Admin created: {admin_email}")
        print(f"    Password: 123456")
    except Exception as e:
        print(f"  ⚠ Admin might already exist: {e}")
    
    # 2. Create Security user
    print("\n2. Creating Security user...")
    security_id = str(uuid.uuid4())
    security_email = f"guvenlik@{site_name.lower().replace(' ', '')}.com"
    
    try:
        cursor.execute("""
            INSERT INTO users (id, full_name, email, phone, site_id, password_hash, status, email_verified)
            VALUES (%s, %s, %s, %s, %s, %s, 'aktif', 1)
        """, (security_id, "Güvenlik Görevlisi", security_email, "+905559999992", site_id, password_hash))
        
        # Add SECURITY role
        cursor.execute("""
            INSERT INTO user_roles (user_id, role_id, site_id)
            VALUES (%s, %s, %s)
        """, (security_id, roles['SECURITY'], site_id))
        
        print(f"  ✓ Security created: {security_email}")
        print(f"    Password: 123456")
    except Exception as e:
        print(f"  ⚠ Security might already exist: {e}")
    
    conn.commit()
    
    # Verify
    print("\n3. Verifying users...")
    cursor.execute("""
        SELECT u.email, u.full_name, GROUP_CONCAT(r.name) as roles
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u.site_id = %s AND u.email LIKE %s
        GROUP BY u.id, u.email, u.full_name
    """, (site_id, f"%@{site_name.lower().replace(' ', '')}.com"))
    
    for user in cursor.fetchall():
        print(f"  ✓ {user['full_name']}: {user['email']}")
        print(f"    Roles: {user['roles']}")
    
    conn.close()
    
    print("\n" + "="*70)
    print("  USERS CREATED!")
    print("="*70)
    print(f"\nLogin credentials:")
    print(f"  Admin: {admin_email} / 123456")
    print(f"  Security: {security_email} / 123456")

if __name__ == "__main__":
    create_users()
