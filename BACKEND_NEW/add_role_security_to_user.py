#!/usr/bin/env python3
import mysql.connector
from datetime import datetime

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)

cursor = conn.cursor(dictionary=True)

# Get security user
cursor.execute("SELECT id, site_id FROM users WHERE email = 'guvenlik@sehirmerkezi.com'")
user = cursor.fetchone()

if not user:
    print("ERROR: User not found!")
    exit(1)

user_id = user['id']
site_id = user['site_id']

# Get ROLE_SECURITY role ID
cursor.execute("SELECT id FROM roles WHERE name = 'ROLE_SECURITY'")
role = cursor.fetchone()

if not role:
    print("ERROR: ROLE_SECURITY not found!")
    exit(1)

role_id = role['id']

print(f"OK: User: {user_id}, Site: {site_id}, Role: {role_id}")

# Check if user already has this role
cursor.execute("""
    SELECT id FROM user_roles 
    WHERE user_id = %s AND role_id = %s
""", (user_id, role_id))

existing = cursor.fetchone()

if existing:
    print("OK: User already has ROLE_SECURITY")
else:
    # Add role
    cursor.execute("""
        INSERT INTO user_roles (user_id, role_id, site_id, assigned_at, created_at)
        VALUES (%s, %s, %s, %s, %s)
    """, (user_id, role_id, site_id, datetime.now(), datetime.now()))
    
    conn.commit()
    print("OK: Added ROLE_SECURITY to user")

conn.close()
