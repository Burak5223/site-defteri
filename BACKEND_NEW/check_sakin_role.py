#!/usr/bin/env python3
"""
Check sakin user's role in database
"""

import mysql.connector
import json

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'Hilton5252.',
    'database': 'smart_site_management'
}

def check_sakin_role():
    """Check sakin user's role"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        # Get sakin user details
        cursor.execute("""
            SELECT id, email, role, site_id, apartment_id, block_name, unit_number
            FROM users 
            WHERE email = 'sakin@site.com'
        """)
        
        user = cursor.fetchone()
        if user:
            print(f"✅ Found sakin user:")
            print(f"   ID: {user['id']}")
            print(f"   Email: {user['email']}")
            print(f"   Role: {user['role']}")
            print(f"   Site ID: {user['site_id']}")
            print(f"   Apartment ID: {user['apartment_id']}")
            print(f"   Block: {user['block_name']}")
            print(f"   Unit: {user['unit_number']}")
            
            # Check if role is correct
            if user['role'] == 'RESIDENT':
                print("✅ Role is correct: RESIDENT")
            else:
                print(f"❌ Role is incorrect: {user['role']} (should be RESIDENT)")
                
                # Fix the role
                cursor.execute("""
                    UPDATE users 
                    SET role = 'RESIDENT' 
                    WHERE email = 'sakin@site.com'
                """)
                conn.commit()
                print("✅ Fixed role to RESIDENT")
        else:
            print("❌ Sakin user not found")
            
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Database error: {e}")

if __name__ == "__main__":
    check_sakin_role()