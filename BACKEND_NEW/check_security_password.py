#!/usr/bin/env python3
import mysql.connector
import os

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password=os.getenv('DB_PASSWORD', 'Hilton5252.'),
    database='smart_site_management'
)

cursor = conn.cursor()

print("\n=== SECURITY USER PASSWORD CHECK ===")
cursor.execute("""
    SELECT u.id, u.email, u.full_name, u.password_hash
    FROM users u
    WHERE u.email = 'guvenlik@site.com'
""")
user = cursor.fetchone()

if user:
    print(f"User ID: {user[0]}")
    print(f"Email: {user[1]}")
    print(f"Name: {user[2]}")
    print(f"Password Hash: {user[3][:60]}...")
    print(f"\nTry logging in with:")
    print(f"  Email: {user[1]}")
    print(f"  Password: 123456 (if hash starts with $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy)")
    print(f"  Password: guvenlik123 (if different hash)")
else:
    print("No security user found")

cursor.close()
conn.close()
