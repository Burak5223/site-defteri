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

print("\n=== RESIDENT USER (sakinuser) ===")
cursor.execute("""
    SELECT u.id, u.email, u.phone, u.full_name, u.site_id
    FROM users u
    INNER JOIN user_roles ur ON u.id = ur.user_id
    WHERE ur.role_name = 'ROLE_RESIDENT'
    AND (u.email LIKE '%sakin%' OR u.phone LIKE '%sakin%' OR u.full_name LIKE '%Sakin%')
    LIMIT 1
""")
resident = cursor.fetchone()
if resident:
    print(f"ID: {resident[0]}")
    print(f"Email: {resident[1]}")
    print(f"Phone: {resident[2]}")
    print(f"Name: {resident[3]}")
    print(f"Site ID: {resident[4]}")
    
    # Check apartment membership
    cursor.execute("""
        SELECT apartment_id FROM apartment_members WHERE user_id = %s LIMIT 1
    """, (resident[0],))
    apt = cursor.fetchone()
    if apt:
        print(f"Apartment ID: {apt[0]}")
    
    print(f"\n✓ Login credentials:")
    if resident[1]:
        print(f"  Email: {resident[1]}")
    if resident[2]:
        print(f"  Phone: {resident[2]}")
    print(f"  Password: 123456")
else:
    print("❌ No resident user found with 'sakin' in name")
    print("\nSearching for ANY resident user...")
    cursor.execute("""
        SELECT u.id, u.email, u.phone, u.full_name, u.site_id
        FROM users u
        INNER JOIN user_roles ur ON u.id = ur.user_id
        WHERE ur.role_name = 'ROLE_RESIDENT'
        LIMIT 1
    """)
    resident = cursor.fetchone()
    if resident:
        print(f"Found: {resident[3]}")
        print(f"Email: {resident[1]}")
        print(f"Phone: {resident[2]}")

print("\n=== SECURITY USER (guvenlik) ===")
cursor.execute("""
    SELECT u.id, u.email, u.phone, u.full_name, u.site_id 
    FROM users u
    INNER JOIN user_roles ur ON u.id = ur.user_id
    WHERE ur.role_name = 'ROLE_SECURITY'
    AND (u.email LIKE '%guvenlik%' OR u.phone LIKE '%guvenlik%' OR u.full_name LIKE '%Güvenlik%')
    LIMIT 1
""")
security = cursor.fetchone()
if security:
    print(f"ID: {security[0]}")
    print(f"Email: {security[1]}")
    print(f"Phone: {security[2]}")
    print(f"Name: {security[3]}")
    print(f"Site ID: {security[4]}")
    
    print(f"\n✓ Login credentials:")
    if security[1]:
        print(f"  Email: {security[1]}")
    if security[2]:
        print(f"  Phone: {security[2]}")
    print(f"  Password: 123456")
else:
    print("❌ No security user found with 'guvenlik' in name")
    print("\nSearching for ANY security user...")
    cursor.execute("""
        SELECT u.id, u.email, u.phone, u.full_name, u.site_id
        FROM users u
        INNER JOIN user_roles ur ON u.id = ur.user_id
        WHERE ur.role_name = 'ROLE_SECURITY'
        LIMIT 1
    """)
    security = cursor.fetchone()
    if security:
        print(f"Found: {security[3]}")
        print(f"Email: {security[1]}")
        print(f"Phone: {security[2]}")

cursor.close()
conn.close()
