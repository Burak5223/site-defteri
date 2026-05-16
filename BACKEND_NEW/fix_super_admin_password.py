#!/usr/bin/env python3
"""
Fix super admin password to super123
"""
import mysql.connector
import os

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password=os.getenv('DB_PASSWORD', 'Hilton5252.'),
    database='smart_site_management'
)

cursor = conn.cursor()

print("=== Fixing Super Admin Password ===\n")

# Password hash for "super123"
password_hash = "$2b$12$IxY0P/YRuSRPsw.SAKO/1.dafM76/bOWwjZY7luRnL.gQfWQ3DFSi"

# Update super admin password
cursor.execute("""
    UPDATE users
    SET password_hash = %s, updated_at = NOW()
    WHERE email = 'superadmin@site.com'
""", (password_hash,))

conn.commit()

print(f"✓ Super admin password updated to: super123")
print(f"  Email: superadmin@site.com")
print(f"  Password: super123")

cursor.close()
conn.close()
