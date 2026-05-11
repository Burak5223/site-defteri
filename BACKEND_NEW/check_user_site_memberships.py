#!/usr/bin/env python3
"""
Check user_site_memberships table structure
"""

import mysql.connector

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'Hilton5252.',
    'database': 'smart_site_management'
}

def check_user_site_memberships():
    """Check user_site_memberships table"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        # Show table structure
        cursor.execute("DESCRIBE user_site_memberships")
        columns = cursor.fetchall()
        
        print("📋 User_site_memberships table structure:")
        for col in columns:
            print(f"   {col['Field']}: {col['Type']} ({col['Null']}, {col['Key']}, {col['Default']})")
        
        # Get sakin user memberships
        sakin_user_id = 'f0b9fe5d-8266-453b-a02a-87d67801a0b1'
        
        cursor.execute("SELECT * FROM user_site_memberships WHERE user_id = %s", (sakin_user_id,))
        memberships = cursor.fetchall()
        
        if memberships:
            print(f"\n✅ Found sakin user site memberships:")
            for membership in memberships:
                for key, value in membership.items():
                    print(f"   {key}: {value}")
                print("   ---")
        else:
            print(f"\n❌ No site memberships found for sakin user")
            
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Database error: {e}")

if __name__ == "__main__":
    check_user_site_memberships()