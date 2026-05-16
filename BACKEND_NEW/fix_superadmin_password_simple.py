#!/usr/bin/env python3
"""
Simple fix - just update super admin password
"""
import mysql.connector

connection = mysql.connector.connect(
    host='localhost',
    database='smart_site_management',
    user='root',
    password='Hilton5252.'
)

cursor = connection.cursor(dictionary=True)

print("=== Fixing Super Admin Password ===\n")

# Check current password
cursor.execute("SELECT id, email, password_hash FROM users WHERE email = 'superadmin@site.com'")
user = cursor.fetchone()

if user:
    print(f"✓ Found: {user['email']}")
    print(f"  Current hash: {user['password_hash'][:50]}...")
    
    # Update to super123
    correct_hash = "$2b$12$IxY0P/YRuSRPsw.SAKO/1.dafM76/bOWwjZY7luRnL.gQfWQ3DFSi"
    
    cursor.execute("UPDATE users SET password_hash = %s WHERE email = 'superadmin@site.com'", (correct_hash,))
    connection.commit()
    
    print(f"\n✓ Password updated!")
    print(f"  New hash: {correct_hash[:50]}...")
    
    print("\n" + "="*60)
    print("LOGIN CREDENTIALS:")
    print("="*60)
    print("Email: superadmin@site.com")
    print("Password: super123")
    print("="*60)
else:
    print("❌ Super admin not found!")

cursor.close()
connection.close()
