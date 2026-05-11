#!/usr/bin/env python3
"""
Check user roles in site_memberships table
"""

import mysql.connector

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'Hilton5252.',
    'database': 'smart_site_management'
}

def check_user_roles():
    """Check user roles"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        # Get sakin user's roles
        cursor.execute("""
            SELECT u.id, u.email, sm.role, sm.site_id, sm.apartment_id, sm.block_name, sm.unit_number
            FROM users u
            LEFT JOIN site_memberships sm ON u.id = sm.user_id
            WHERE u.email = 'sakin@site.com'
        """)
        
        memberships = cursor.fetchall()
        
        if memberships:
            print(f"✅ Found sakin user memberships:")
            for membership in memberships:
                print(f"   User ID: {membership['id']}")
                print(f"   Email: {membership['email']}")
                print(f"   Role: {membership['role']}")
                print(f"   Site ID: {membership['site_id']}")
                print(f"   Apartment ID: {membership['apartment_id']}")
                print(f"   Block: {membership['block_name']}")
                print(f"   Unit: {membership['unit_number']}")
                print("   ---")
                
                # Check if role is correct
                if membership['role'] == 'RESIDENT':
                    print("✅ Role is correct: RESIDENT")
                elif membership['role'] is None:
                    print("❌ No role assigned - creating RESIDENT membership")
                    
                    # Create RESIDENT membership
                    cursor.execute("""
                        INSERT INTO site_memberships (user_id, site_id, role, apartment_id, block_name, unit_number, is_active)
                        VALUES (%s, %s, 'RESIDENT', %s, %s, %s, 1)
                        ON DUPLICATE KEY UPDATE role = 'RESIDENT', is_active = 1
                    """, (membership['id'], '1', membership['apartment_id'], membership['block_name'], membership['unit_number']))
                    conn.commit()
                    print("✅ Created RESIDENT membership")
                else:
                    print(f"❌ Role is incorrect: {membership['role']} (should be RESIDENT)")
                    
                    # Fix the role
                    cursor.execute("""
                        UPDATE site_memberships 
                        SET role = 'RESIDENT' 
                        WHERE user_id = %s AND site_id = %s
                    """, (membership['id'], membership['site_id']))
                    conn.commit()
                    print("✅ Fixed role to RESIDENT")
        else:
            print("❌ Sakin user not found or no memberships")
            
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Database error: {e}")

if __name__ == "__main__":
    check_user_roles()