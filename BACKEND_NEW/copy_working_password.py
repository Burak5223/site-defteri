#!/usr/bin/env python3
"""
Copy working password hash from resident to admin and security
"""

import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)
cursor = conn.cursor(dictionary=True)

print("="*70)
print("  COPYING WORKING PASSWORD HASH")
print("="*70)

# Get working resident password hash
cursor.execute("""
    SELECT password_hash FROM users 
    WHERE email = 'sakin1@yeşilvadisitesi.com'
""")
resident = cursor.fetchone()

if not resident:
    print("\n✗ Resident user not found!")
    conn.close()
    exit(1)

working_hash = resident['password_hash']
print(f"\n✓ Got working hash from resident")
print(f"  Hash: {working_hash[:50]}...")

# Update admin
cursor.execute("""
    UPDATE users 
    SET password_hash = %s
    WHERE email = 'admin@yeşilvadisitesi.com'
""", (working_hash,))

admin_updated = cursor.rowcount
print(f"\n✓ Updated admin user ({admin_updated} rows)")

# Update security
cursor.execute("""
    UPDATE users 
    SET password_hash = %s
    WHERE email = 'guvenlik@yeşilvadisitesi.com'
""", (working_hash,))

security_updated = cursor.rowcount
print(f"✓ Updated security user ({security_updated} rows)")

conn.commit()
conn.close()

print("\n" + "="*70)
print("  PASSWORD HASH COPIED!")
print("="*70)
print("\nAll users now have the same password: 123456")
print("Try logging in again!")
