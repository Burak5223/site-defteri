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

print("\n=== CHECKING USERS TABLE STRUCTURE ===")
cursor.execute("DESCRIBE users")
columns = cursor.fetchall()
print("Columns in users table:")
for col in columns:
    print(f"  - {col[0]} ({col[1]})")

print("\n=== RESIDENT USER ===")
cursor.execute("""
    SELECT u.id, u.email, u.phone, u.full_name, r.apartment_id, u.site_id
    FROM users u
    INNER JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN residency r ON u.id = r.user_id
    WHERE ur.role_name = 'ROLE_RESIDENT'
    LIMIT 1
""")
resident = cursor.fetchone()
if resident:
    print(f"ID: {resident[0]}")
    print(f"Email: {resident[1]}")
    print(f"Phone: {resident[2]}")
    print(f"Name: {resident[3]}")
    print(f"Apartment ID: {resident[4]}")
    print(f"Site ID: {resident[5]}")
    print(f"\nLogin with:")
    if resident[1]:
        print(f"  email={resident[1]}, password=123456")
    if resident[2]:
        print(f"  phone={resident[2]}, password=123456")
else:
    print("No resident user found")

print("\n=== SECURITY USER ===")
cursor.execute("""
    SELECT u.id, u.email, u.phone, u.full_name, u.site_id 
    FROM users u
    INNER JOIN user_roles ur ON u.id = ur.user_id
    WHERE ur.role_name = 'ROLE_SECURITY'
    LIMIT 1
""")
security = cursor.fetchone()
if security:
    print(f"ID: {security[0]}")
    print(f"Email: {security[1]}")
    print(f"Phone: {security[2]}")
    print(f"Name: {security[3]}")
    print(f"Site ID: {security[4]}")
    print(f"\nLogin with:")
    if security[1]:
        print(f"  email={security[1]}, password=123456")
    if security[2]:
        print(f"  phone={security[2]}, password=123456")
else:
    print("No security user found")

cursor.close()
conn.close()
