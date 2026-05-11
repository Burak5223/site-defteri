#!/usr/bin/env python3

import mysql.connector

def check_phone_usage():
    try:
        # Database connection
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='Hilton5252.',
            database='smart_site_management'
        )
        cursor = conn.cursor(dictionary=True)
        
        print("=== Checking Phone Number Usage ===")
        
        # Check for the phone number we're trying to use
        cursor.execute("""
            SELECT id, full_name, email, phone, status, created_at
            FROM users 
            WHERE phone = '+905559999999'
        """)
        
        users = cursor.fetchall()
        
        if users:
            print(f"Found {len(users)} user(s) with phone +905559999999:")
            for user in users:
                print(f"  - ID: {user['id']}")
                print(f"    Name: {user['full_name']}")
                print(f"    Email: {user['email']}")
                print(f"    Status: {user['status']}")
                print(f"    Created: {user['created_at']}")
                print()
        else:
            print("No users found with phone +905559999999")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_phone_usage()