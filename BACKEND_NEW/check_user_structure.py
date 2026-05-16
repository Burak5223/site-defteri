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

print("\n=== USER_ROLES TABLE STRUCTURE ===")
cursor.execute("DESCRIBE user_roles")
columns = cursor.fetchall()
for col in columns:
    print(f"  {col[0]} ({col[1]})")

print("\n=== SAMPLE USER_ROLES DATA ===")
cursor.execute("SELECT * FROM user_roles LIMIT 5")
rows = cursor.fetchall()
for row in rows:
    print(row)

print("\n=== FINDING RESIDENT USER ===")
cursor.execute("""
    SELECT u.id, u.email, u.phone, u.full_name, u.site_id, ur.role
    FROM users u
    INNER JOIN user_roles ur ON u.id = ur.user_id
    WHERE ur.role = 'ROLE_RESIDENT'
    LIMIT 1
""")
resident = cursor.fetchone()
if resident:
    print(f"✓ Found resident:")
    print(f"  Email: {resident[1]}")
    print(f"  Phone: {resident[2]}")
    print(f"  Name: {resident[3]}")
    print(f"  Password: 123456")

print("\n=== FINDING SECURITY USER ===")
cursor.execute("""
    SELECT u.id, u.email, u.phone, u.full_name, u.site_id, ur.role
    FROM users u
    INNER JOIN user_roles ur ON u.id = ur.user_id
    WHERE ur.role = 'ROLE_SECURITY'
    LIMIT 1
""")
security = cursor.fetchone()
if security:
    print(f"✓ Found security:")
    print(f"  Email: {security[1]}")
    print(f"  Phone: {security[2]}")
    print(f"  Name: {security[3]}")
    print(f"  Password: 123456")

cursor.close()
conn.close()
