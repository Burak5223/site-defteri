#!/usr/bin/env python3
import mysql.connector
import bcrypt

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)
cursor = conn.cursor(dictionary=True)

email = "ali.korkmaz15@yesilvadi.com"
cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
user = cursor.fetchone()

if user:
    print(f"User: {user['full_name']}")
    print(f"Email: {user['email']}")
    print(f"Status: {user['status']}")
    print(f"Password hash: {user['password_hash']}")
    print()
    
    # Test password
    test_password = "password123"
    try:
        if bcrypt.checkpw(test_password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            print("✓ Password 'password123' is CORRECT")
        else:
            print("✗ Password 'password123' is WRONG")
    except Exception as e:
        print(f"Error: {e}")
else:
    print("User not found")

cursor.close()
conn.close()
