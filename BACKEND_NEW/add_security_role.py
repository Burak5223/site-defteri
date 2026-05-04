#!/usr/bin/env python3
import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)

cursor = conn.cursor(dictionary=True)

# Get security user
cursor.execute("SELECT id FROM users WHERE email = 'guvenlik@sehirmerkezi.com'")
user = cursor.fetchone()

if not user:
    print("ERROR: User not found!")
    exit(1)

user_id = user['id']
print(f"OK: User ID: {user_id}")

# Check user_roles table structure
cursor.execute("DESCRIBE user_roles")
columns = [col['Field'] for col in cursor.fetchall()]
print(f"OK: user_roles columns: {columns}")

# Check if user has SECURITY role
if 'role' in columns:
    cursor.execute("SELECT * FROM user_roles WHERE user_id = %s AND role = 'SECURITY'", (user_id,))
    role = cursor.fetchone()
    
    if not role:
        cursor.execute("INSERT INTO user_roles (user_id, role) VALUES (%s, %s)", (user_id, 'SECURITY'))
        conn.commit()
        print("OK: Added SECURITY role")
    else:
        print("OK: User already has SECURITY role")
        
elif 'role_name' in columns:
    cursor.execute("SELECT * FROM user_roles WHERE user_id = %s AND role_name = 'SECURITY'", (user_id,))
    role = cursor.fetchone()
    
    if not role:
        from datetime import datetime
        cursor.execute("INSERT INTO user_roles (user_id, role_name, assigned_at) VALUES (%s, %s, %s)", 
                      (user_id, 'SECURITY', datetime.now()))
        conn.commit()
        print("OK: Added SECURITY role")
    else:
        print("OK: User already has SECURITY role")
else:
    print("WARNING: Unknown user_roles table structure")

conn.close()
