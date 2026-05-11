#!/usr/bin/env python3

import mysql.connector

def find_empty_apartment():
    try:
        # Database connection
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='Hilton5252.',
            database='smart_site_management'
        )
        cursor = conn.cursor(dictionary=True)
        
        print("=== Finding Empty Apartments ===")
        
        # Find apartments with no current resident
        cursor.execute("""
            SELECT id, site_id, block_name, unit_number, owner_user_id, current_resident_id, status
            FROM apartments 
            WHERE site_id = '1' 
            AND (current_resident_id IS NULL OR current_resident_id = '')
            ORDER BY unit_number
            LIMIT 5
        """)
        
        empty_apartments = cursor.fetchall()
        
        if empty_apartments:
            print(f"Found {len(empty_apartments)} empty apartment(s):")
            for apt in empty_apartments:
                print(f"  - Unit: {apt['unit_number']} ({apt['block_name']})")
                print(f"    ID: {apt['id']}")
                print(f"    Owner: {apt['owner_user_id']}")
                print(f"    Current Resident: {apt['current_resident_id']}")
                print(f"    Status: {apt['status']}")
                print()
        else:
            print("No empty apartments found")
        
        cursor.close()
        conn.close()
        
        return empty_apartments
        
    except Exception as e:
        print(f"Error: {e}")
        return []

if __name__ == "__main__":
    find_empty_apartment()