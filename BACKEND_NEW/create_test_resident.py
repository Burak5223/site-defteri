#!/usr/bin/env python3
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

cursor = conn.cursor()

# Get ROLE_RESIDENT role ID
cursor.execute("SELECT id FROM roles WHERE name = 'ROLE_RESIDENT'")
role_result = cursor.fetchone()
if not role_result:
    print("❌ ROLE_RESIDENT not found")
    exit(1)

resident_role_id = role_result[0]
print(f"✓ Found ROLE_RESIDENT: {resident_role_id}")

# Get first apartment
cursor.execute("SELECT id, site_id FROM apartments WHERE is_deleted = 0 LIMIT 1")
apt_result = cursor.fetchone()
if not apt_result:
    print("❌ No apartments found")
    exit(1)

apartment_id = apt_result[0]
site_id = apt_result[1]
print(f"✓ Found apartment: {apartment_id}, site: {site_id}")

# Create test resident user
user_id = str(uuid.uuid4())
email = "testsakin@test.com"
phone = "5551234567"
full_name = "Test Sakin"
password_hash = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"  # 123456

print(f"\n=== Creating Test Resident User ===")
print(f"Email: {email}")
print(f"Phone: {phone}")
print(f"Name: {full_name}")
print(f"Password: 123456")

try:
    # Insert user
    cursor.execute("""
        INSERT INTO users (
            id, full_name, email, phone, site_id, password_hash, 
            status, email_verified, phone_verified, created_at, updated_at
        ) VALUES (
            %s, %s, %s, %s, %s, %s, 
            'aktif', 1, 1, NOW(), NOW()
        )
    """, (user_id, full_name, email, phone, site_id, password_hash))
    
    # Assign role
    role_assignment_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO user_roles (
            id, user_id, role_id, site_id, assigned_at, created_at, updated_at
        ) VALUES (
            %s, %s, %s, %s, NOW(), NOW(), NOW()
        )
    """, (role_assignment_id, user_id, resident_role_id, site_id))
    
    # Assign to apartment
    membership_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO apartment_members (
            id, apartment_id, user_id, membership_type, status, 
            start_date, created_at, updated_at
        ) VALUES (
            %s, %s, %s, 'owner', 'active', 
            NOW(), NOW(), NOW()
        )
    """, (membership_id, apartment_id, user_id))
    
    conn.commit()
    
    print("\n✓ Test resident user created successfully!")
    print(f"\nLOGIN CREDENTIALS:")
    print(f"  Email: {email}")
    print(f"  Phone: {phone}")
    print(f"  Password: 123456")
    print(f"  Apartment ID: {apartment_id}")
    
except Exception as e:
    conn.rollback()
    print(f"\n❌ Error creating user: {e}")

cursor.close()
conn.close()
