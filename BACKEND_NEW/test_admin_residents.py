#!/usr/bin/env python3
"""
Test admin user login and residents endpoint
"""

import requests
import json

BASE_URL = "http://localhost:8080/api"

print("=" * 80)
print("TESTING ADMIN RESIDENTS ENDPOINT")
print("=" * 80)
print()

# Login as admin
print("1. Logging in as admin...")
print("-" * 80)

# First, let's find an admin user
import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)
cursor = conn.cursor(dictionary=True)

# Find admin for site 1
cursor.execute("""
    SELECT u.id, u.email, u.full_name
    FROM users u
    JOIN user_site_memberships usm ON u.id = usm.user_id
    WHERE usm.site_id = '1'
    AND usm.role_type = 'yonetici'
    LIMIT 1
""")
admin = cursor.fetchone()

if not admin:
    print("✗ No admin found for site 1")
    print("Creating a test admin...")
    
    # Create admin user
    import uuid
    import bcrypt
    
    admin_id = str(uuid.uuid4())
    admin_email = "admin@yesilvadi.com"
    admin_password = "admin123"
    password_hash = bcrypt.hashpw(admin_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    cursor.execute("""
        INSERT INTO users (id, full_name, email, password_hash, phone, status)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (admin_id, "Admin User", admin_email, password_hash, "+905551234567", "aktif"))
    
    cursor.execute("""
        INSERT INTO user_site_memberships (id, user_id, site_id, role_type, status, is_deleted)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (str(uuid.uuid4()), admin_id, "1", "yonetici", "aktif", 0))
    
    conn.commit()
    
    admin = {
        'id': admin_id,
        'email': admin_email,
        'full_name': 'Admin User'
    }
    
    print(f"✓ Admin created: {admin_email} / {admin_password}")
else:
    # Update admin password to known value
    import bcrypt
    admin_password = "admin123"
    password_hash = bcrypt.hashpw(admin_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    cursor.execute("UPDATE users SET password_hash = %s WHERE id = %s", (password_hash, admin['id']))
    conn.commit()
    print(f"✓ Admin found: {admin['email']}")
    print(f"  Password reset to: {admin_password}")

cursor.close()
conn.close()

print()

# Login
login_data = {
    "email": admin['email'],
    "password": admin_password
}

try:
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if response.status_code == 200:
        auth_data = response.json()
        token = auth_data.get('accessToken')
        print(f"✓ Login successful!")
        print(f"  User: {auth_data.get('user', {}).get('fullName')}")
        print(f"  Role: {auth_data.get('user', {}).get('roles', [])}")
    else:
        print(f"✗ Login failed: {response.status_code}")
        print(f"  Response: {response.text}")
        exit(1)
except Exception as e:
    print(f"✗ Error during login: {e}")
    exit(1)

print()

# Test /api/users endpoint
print("2. Testing /api/users endpoint...")
print("-" * 80)
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

try:
    response = requests.get(f"{BASE_URL}/users", headers=headers)
    if response.status_code == 200:
        users = response.json()
        print(f"✓ Endpoint successful!")
        print(f"  Total users returned: {len(users)}")
        
        # Count by block
        blocks = {}
        for user in users:
            if user.get('blockName'):
                block = user.get('blockName')
                blocks[block] = blocks.get(block, 0) + 1
        
        print(f"\n  Distribution by block:")
        for block, count in sorted(blocks.items()):
            print(f"    {block}: {count} users")
        
        # Count by type
        types = {}
        for user in users:
            if user.get('residentType'):
                res_type = user.get('residentType')
                types[res_type] = types.get(res_type, 0) + 1
        
        print(f"\n  Distribution by type:")
        for res_type, count in sorted(types.items()):
            print(f"    {res_type}: {count} users")
        
        # Show first 10
        print(f"\n  First 10 users:")
        for i, user in enumerate(users[:10], 1):
            block = user.get('blockName', 'N/A')
            unit = user.get('unitNumber', 'N/A')
            res_type = user.get('residentType', 'N/A')
            print(f"    {i:2}. {user.get('fullName'):25} | {block:10} - {unit:5} | {res_type}")
            
    else:
        print(f"✗ Endpoint failed: {response.status_code}")
        print(f"  Response: {response.text}")
except Exception as e:
    print(f"✗ Error during request: {e}")

print()
print("=" * 80)
print("ADMIN LOGIN CREDENTIALS:")
print("=" * 80)
print(f"Email: {admin['email']}")
print(f"Password: {admin_password}")
print()
print("Use these credentials to login to the mobile app as admin.")
print("=" * 80)
