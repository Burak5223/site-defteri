#!/usr/bin/env python3
"""
Fix passwords for all 97 residents - set to 'password123'
"""

import mysql.connector
import bcrypt

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)
cursor = conn.cursor()

print("=" * 80)
print("FIXING PASSWORDS FOR 97 RESIDENTS")
print("=" * 80)
print()

# Generate correct bcrypt hash for 'password123'
password = "password123"
password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

print(f"New password: {password}")
print(f"New hash: {password_hash}")
print()

# Update all users with @yesilvadi.com emails
print("Updating passwords for all @yesilvadi.com users...")
cursor.execute("""
    UPDATE users 
    SET password_hash = %s
    WHERE email LIKE '%@yesilvadi.com'
""", (password_hash,))

updated_count = cursor.rowcount
conn.commit()

print(f"✓ Updated {updated_count} users")
print()

# Verify one user
print("Verifying update...")
cursor.execute("SELECT email, password_hash FROM users WHERE email LIKE '%@yesilvadi.com' LIMIT 1")
user = cursor.fetchone()

if user:
    email, stored_hash = user
    print(f"Test user: {email}")
    
    if bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8')):
        print("✓ Password verification SUCCESSFUL!")
    else:
        print("✗ Password verification FAILED!")
else:
    print("No users found")

cursor.close()
conn.close()

print()
print("=" * 80)
print("DONE! All 97 residents now have password: password123")
print("=" * 80)
