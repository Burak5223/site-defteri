#!/usr/bin/env python3
"""
Verify test user can login
"""

import mysql.connector
import bcrypt

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)
cursor = conn.cursor(dictionary=True)

# Check a few test users
test_emails = [
    "mehmet.yilmaz1@yesilvadi.com",
    "ayse.kaya2@yesilvadi.com",
    "fatma.demir3@yesilvadi.com"
]

print("Checking test users...")
print("=" * 80)

for email in test_emails:
    cursor.execute("""
        SELECT id, full_name, email, password_hash, status
        FROM users
        WHERE email = %s
    """, (email,))
    user = cursor.fetchone()
    
    if user:
        print(f"\n✓ User: {user['full_name']}")
        print(f"  Email: {user['email']}")
        print(f"  Status: {user['status']}")
        print(f"  Hash: {user['password_hash'][:60]}...")
        
        # Test password verification
        test_password = "password123"
        password_bytes = test_password.encode('utf-8')
        hash_bytes = user['password_hash'].encode('utf-8')
        
        try:
            if bcrypt.checkpw(password_bytes, hash_bytes):
                print(f"  ✓ Password 'password123' matches!")
            else:
                print(f"  ✗ Password 'password123' does NOT match")
        except Exception as e:
            print(f"  ✗ Error checking password: {e}")
    else:
        print(f"\n✗ User not found: {email}")

cursor.close()
conn.close()
