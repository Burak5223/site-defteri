#!/usr/bin/env python3
"""
Check users table structure
"""

import mysql.connector

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'Hilton5252.',
    'database': 'smart_site_management'
}

def check_users_table():
    """Check users table structure"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        # Show table structure
        cursor.execute("DESCRIBE users")
        columns = cursor.fetchall()
        
        print("📋 Users table structure:")
        for col in columns:
            print(f"   {col['Field']}: {col['Type']} ({col['Null']}, {col['Key']}, {col['Default']})")
        
        # Get sakin user
        cursor.execute("SELECT * FROM users WHERE email = 'sakin@site.com' LIMIT 1")
        user = cursor.fetchone()
        
        if user:
            print(f"\n✅ Found sakin user:")
            for key, value in user.items():
                print(f"   {key}: {value}")
        else:
            print("\n❌ Sakin user not found")
            
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Database error: {e}")

if __name__ == "__main__":
    check_users_table()