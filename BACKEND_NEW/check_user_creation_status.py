#!/usr/bin/env python3

import mysql.connector

def check_user_creation():
    try:
        # Database connection
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='Hilton5252.',
            database='smart_site_management'
        )
        cursor = conn.cursor(dictionary=True)
        
        print("=== Checking Recent User Creation ===")
        
        # Check for the test user we just tried to create
        cursor.execute("""
            SELECT id, full_name, email, phone, status, created_at
            FROM users 
            WHERE email = 'test.kiraci13@example.com'
            ORDER BY created_at DESC
            LIMIT 1
        """)
        
        user = cursor.fetchone()
        
        if user:
            print("User found:")
            print(f"  ID: {user['id']}")
            print(f"  Name: {user['full_name']}")
            print(f"  Email: {user['email']}")
            print(f"  Phone: {user['phone']}")
            print(f"  Status: {user['status']}")
            print(f"  Created: {user['created_at']}")
            
            # Check apartment assignment
            cursor.execute("""
                SELECT id, block_name, unit_number, owner_user_id, current_resident_id, status
                FROM apartments 
                WHERE owner_user_id = %s OR current_resident_id = %s
            """, (user['id'], user['id']))
            
            apartments = cursor.fetchall()
            if apartments:
                print("\nAssigned apartments:")
                for apt in apartments:
                    print(f"  - {apt['block_name']} {apt['unit_number']}")
                    print(f"    Owner: {apt['owner_user_id']}")
                    print(f"    Resident: {apt['current_resident_id']}")
                    print(f"    Status: {apt['status']}")
            else:
                print("\nNo apartments assigned")
                
            # Check residency history
            cursor.execute("""
                SELECT id, apartment_id, move_in_date, is_owner, status
                FROM residency_history 
                WHERE user_id = %s
            """, (user['id'],))
            
            history = cursor.fetchall()
            if history:
                print("\nResidency history:")
                for h in history:
                    print(f"  - Apartment: {h['apartment_id']}")
                    print(f"    Move in: {h['move_in_date']}")
                    print(f"    Is owner: {h['is_owner']}")
                    print(f"    Status: {h['status']}")
            else:
                print("\nNo residency history found")
                
        else:
            print("User not found - transaction was rolled back")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_user_creation()