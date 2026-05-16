#!/usr/bin/env python3
"""
Check super admin credentials
"""
import mysql.connector
from mysql.connector import Error

def check_superadmin():
    try:
        connection = mysql.connector.connect(
            host='localhost',
            database='smart_site_management',
            user='root',
            password='Hilton5252.'
        )
        
        if connection.is_connected():
            cursor = connection.cursor(dictionary=True)
            
            print("=== Checking Super Admin Credentials ===\n")
            
            # Check super admin user
            cursor.execute("""
                SELECT id, email, password, full_name, role, status
                FROM users
                WHERE email = 'superadmin@site.com'
            """)
            
            user = cursor.fetchone()
            
            if user:
                print(f"✓ Super Admin Found:")
                print(f"  Email: {user['email']}")
                print(f"  Full Name: {user['full_name']}")
                print(f"  Role: {user['role']}")
                print(f"  Status: {user['status']}")
                print(f"  Password Hash: {user['password'][:50]}...")
                
                # Check if password is correct
                correct_hash = "$2b$12$IxY0P/YRuSRPsw.SAKO/1.dafM76/bOWwjZY7luRnL.gQfWQ3DFSi"
                
                if user['password'] == correct_hash:
                    print(f"\n✓ Password hash is CORRECT (super123)")
                else:
                    print(f"\n❌ Password hash is WRONG")
                    print(f"  Current: {user['password']}")
                    print(f"  Expected: {correct_hash}")
            else:
                print("❌ Super Admin user NOT found!")
            
            cursor.close()
            
    except Error as e:
        print(f"❌ Database error: {e}")
    finally:
        if connection.is_connected():
            connection.close()

if __name__ == "__main__":
    check_superadmin()
