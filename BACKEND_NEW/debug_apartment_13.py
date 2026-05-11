#!/usr/bin/env python3

import mysql.connector
import json

def debug_apartment_13():
    try:
        # Database connection
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='root',
            database='site_yonetim'
        )
        cursor = conn.cursor(dictionary=True)
        
        print("=== DAIRE 13 DEBUG ===")
        
        # Check if apartment 13 exists
        cursor.execute("""
            SELECT * FROM apartments 
            WHERE unit_number = '13' OR unit_number = 13
        """)
        apartments = cursor.fetchall()
        
        print(f"\nApartments with unit number 13:")
        for apt in apartments:
            print(f"  ID: {apt['id']}")
            print(f"  Block: {apt['block_name']}")
            print(f"  Unit: {apt['unit_number']}")
            print(f"  Owner: {apt['owner_user_id']}")
            print(f"  Current Resident: {apt['current_resident_id']}")
            print(f"  Status: {apt['status']}")
            print("  ---")
        
        # Check residency history for apartment 13
        if apartments:
            apt_id = apartments[0]['id']
            cursor.execute("""
                SELECT rh.*, u.full_name, u.email 
                FROM residency_history rh
                LEFT JOIN users u ON rh.user_id = u.id
                WHERE rh.apartment_id = %s AND rh.is_deleted = FALSE
                ORDER BY rh.move_in_date DESC
            """, (apt_id,))
            history = cursor.fetchall()
            
            print(f"\nResidency history for apartment 13:")
            for h in history:
                print(f"  User: {h['full_name']} ({h['email']})")
                print(f"  Move in: {h['move_in_date']}")
                print(f"  Move out: {h['move_out_date']}")
                print(f"  Is owner: {h['is_owner']}")
                print(f"  Status: {h['status']}")
                print("  ---")
        
        # Check if there are any users with email containing 'test'
        cursor.execute("""
            SELECT id, full_name, email, status 
            FROM users 
            WHERE email LIKE '%test%' OR full_name LIKE '%Test%'
            ORDER BY full_name
        """)
        test_users = cursor.fetchall()
        
        print(f"\nExisting test users:")
        for user in test_users:
            print(f"  {user['full_name']} ({user['email']}) - {user['status']}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_apartment_13()