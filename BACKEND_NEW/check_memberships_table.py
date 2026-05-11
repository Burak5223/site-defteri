#!/usr/bin/env python3
"""
Check site_memberships table structure
"""

import mysql.connector

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'Hilton5252.',
    'database': 'smart_site_management'
}

def check_memberships_table():
    """Check site_memberships table structure"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        # Show table structure
        cursor.execute("DESCRIBE site_memberships")
        columns = cursor.fetchall()
        
        print("📋 Site_memberships table structure:")
        for col in columns:
            print(f"   {col['Field']}: {col['Type']} ({col['Null']}, {col['Key']}, {col['Default']})")
        
        # Get sakin user memberships
        cursor.execute("""
            SELECT * FROM site_memberships 
            WHERE user_id = (SELECT id FROM users WHERE email = 'sakin@site.com')
        """)
        memberships = cursor.fetchall()
        
        if memberships:
            print(f"\n✅ Found sakin user memberships:")
            for membership in memberships:
                for key, value in membership.items():
                    print(f"   {key}: {value}")
                print("   ---")
        else:
            print("\n❌ No memberships found for sakin user")
            
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Database error: {e}")

if __name__ == "__main__":
    check_memberships_table()