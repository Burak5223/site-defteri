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

print("\n=== RESIDENT USER ===")
cursor.execute("""
    SELECT id, email, phone, full_name, role, apartment_id 
    FROM users 
    WHERE role = 'ROLE_RESIDENT' 
    LIMIT 1
""")
resident = cursor.fetchone()
if resident:
    print(f"ID: {resident[0]}")
    print(f"Email: {resident[1]}")
    print(f"Phone: {resident[2]}")
    print(f"Name: {resident[3]}")
    print(f"Apartment ID: {resident[5]}")

print("\n=== SECURITY USER ===")
cursor.execute("""
    SELECT id, email, phone, full_name, role, site_id 
    FROM users 
    WHERE role = 'ROLE_SECURITY' 
    LIMIT 1
""")
security = cursor.fetchone()
if security:
    print(f"ID: {security[0]}")
    print(f"Email: {security[1]}")
    print(f"Phone: {security[2]}")
    print(f"Name: {security[3]}")
    print(f"Site ID: {security[5]}")

cursor.close()
conn.close()
