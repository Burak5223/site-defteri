#!/usr/bin/env python3
"""
Check user password hash
"""

import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)
cursor = conn.cursor(dictionary=True)

print("Checking user password...")
cursor.execute("""
    SELECT id, full_name, email, password_hash, status
    FROM users
    WHERE email = 'ali.aydın33@yesilvadi.com'
""")
user = cursor.fetchone()

if user:
    print(f"User found: {user['full_name']}")
    print(f"Email: {user['email']}")
    print(f"Status: {user['status']}")
    print(f"Password hash: {user['password_hash'][:60]}...")
    print(f"Hash starts with: {user['password_hash'][:7]}")
    
    if user['password_hash'].startswith('$2a$') or user['password_hash'].startswith('$2b$'):
        print("✓ Password is bcrypt hashed")
    else:
        print("✗ Password is NOT bcrypt hashed")
else:
    print("User not found")

cursor.close()
conn.close()
