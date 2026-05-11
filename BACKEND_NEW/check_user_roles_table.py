#!/usr/bin/env python3
"""
Check user_roles table and fix sakin user role
"""

import mysql.connector

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'Hilton5252.',
    'database': 'smart_site_management'
}

def check_user_roles_table():
    """Check user_roles table"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        # Show user_roles table structure
        cursor.execute("DESCRIBE user_roles")
        columns = cursor.fetchall()
        
        print("📋 User_roles table structure:")
        for col in columns:
            print(f"   {col['Field']}: {col['Type']} ({col['Null']}, {col['Key']}, {col['Default']})")
        
        # Show roles table
        cursor.execute("SELECT * FROM roles")
        roles = cursor.fetchall()
        
        print(f"\n📋 Available roles:")
        for role in roles:
            print(f"   ID: {role['id']}, Name: {role['name']}")
        
        # Get sakin user's roles
        sakin_user_id = 'f0b9fe5d-8266-453b-a02a-87d67801a0b1'  # From previous query
        
        cursor.execute("""
            SELECT ur.*, r.name as role_name
            FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = %s
        """, (sakin_user_id,))
        
        user_roles = cursor.fetchall()
        
        if user_roles:
            print(f"\n✅ Found sakin user roles:")
            for role in user_roles:
                print(f"   Role: {role['role_name']}")
                print(f"   Site ID: {role['site_id']}")
                print(f"   Active: {role['is_active']}")
                print("   ---")
        else:
            print(f"\n❌ No roles found for sakin user")
            
            # Find RESIDENT role ID
            cursor.execute("SELECT id FROM roles WHERE name = 'RESIDENT'")
            resident_role = cursor.fetchone()
            
            if resident_role:
                print(f"✅ Found RESIDENT role ID: {resident_role['id']}")
                
                # Add RESIDENT role to sakin user
                cursor.execute("""
                    INSERT INTO user_roles (user_id, role_id, site_id, is_active)
                    VALUES (%s, %s, '1', 1)
                """, (sakin_user_id, resident_role['id']))
                conn.commit()
                print("✅ Added RESIDENT role to sakin user")
            else:
                print("❌ RESIDENT role not found in roles table")
            
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Database error: {e}")

if __name__ == "__main__":
    check_user_roles_table()