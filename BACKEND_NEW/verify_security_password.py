#!/usr/bin/env python3
import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)

cursor = conn.cursor(dictionary=True)

# Check both users
print("Checking user passwords...\n")

cursor.execute("SELECT id, email, password_hash FROM users WHERE email IN ('sakin1@şehirmerkeziresidence.com', 'guvenlik@sehirmerkezi.com')")
users = cursor.fetchall()

for user in users:
    print(f"Email: {user['email']}")
    print(f"ID: {user['id']}")
    print(f"Password Hash: {user['password_hash'][:60]}...")
    print()

# Get the working hash from sakin1
cursor.execute("SELECT password_hash FROM users WHERE email = 'sakin1@şehirmerkeziresidence.com'")
working_user = cursor.fetchone()

if working_user:
    working_hash = working_user['password_hash']
    
    # Update security user
    cursor.execute("""
        UPDATE users 
        SET password_hash = %s
        WHERE email = 'guvenlik@sehirmerkezi.com'
    """, (working_hash,))
    
    conn.commit()
    print("✓ Updated security user password with working hash")
    print(f"  Both users now have the same password: 123456")
else:
    print("✗ Working user not found")

conn.close()
