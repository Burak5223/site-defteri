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

print("\n=== ROLES TABLE ===")
cursor.execute("SELECT id, name FROM roles")
roles = cursor.fetchall()
for role in roles:
    print(f"  {role[1]} (ID: {role[0]})")

# Find role IDs
resident_role_id = None
security_role_id = None
for role in roles:
    if 'RESIDENT' in role[1]:
        resident_role_id = role[0]
    if 'SECURITY' in role[1]:
        security_role_id = role[0]

if resident_role_id:
    print(f"\n=== RESIDENT USER ===")
    cursor.execute("""
        SELECT u.id, u.email, u.phone, u.full_name, u.site_id
        FROM users u
        INNER JOIN user_roles ur ON u.id = ur.user_id
        WHERE ur.role_id = %s
        AND u.email IS NOT NULL
        LIMIT 1
    """, (resident_role_id,))
    resident = cursor.fetchone()
    if resident:
        print(f"✓ Found resident user:")
        print(f"  Name: {resident[3]}")
        print(f"  Email: {resident[1]}")
        print(f"  Phone: {resident[2]}")
        print(f"  Site ID: {resident[4]}")
        
        # Get apartment
        cursor.execute("""
            SELECT apartment_id FROM apartment_members WHERE user_id = %s LIMIT 1
        """, (resident[0],))
        apt = cursor.fetchone()
        if apt:
            print(f"  Apartment ID: {apt[0]}")
        
        print(f"\n  LOGIN CREDENTIALS:")
        if resident[1]:
            print(f"    email: {resident[1]}")
        if resident[2]:
            print(f"    phone: {resident[2]}")
        print(f"    password: 123456")
    else:
        print("❌ No resident user found with email")

if security_role_id:
    print(f"\n=== SECURITY USER ===")
    cursor.execute("""
        SELECT u.id, u.email, u.phone, u.full_name, u.site_id
        FROM users u
        INNER JOIN user_roles ur ON u.id = ur.user_id
        WHERE ur.role_id = %s
        LIMIT 1
    """, (security_role_id,))
    security = cursor.fetchone()
    if security:
        print(f"✓ Found security user:")
        print(f"  Name: {security[3]}")
        print(f"  Email: {security[1]}")
        print(f"  Phone: {security[2]}")
        print(f"  Site ID: {security[4]}")
        print(f"\n  LOGIN CREDENTIALS:")
        if security[1]:
            print(f"    email: {security[1]}")
        if security[2]:
            print(f"    phone: {security[2]}")
        print(f"    password: 123456")

cursor.close()
conn.close()
