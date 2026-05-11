#!/usr/bin/env python3

import mysql.connector
import sys

def check_apartment_39():
    try:
        # Database connection
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='Hilton5252.',
            database='smart_site_management'
        )
        cursor = conn.cursor(dictionary=True)
        
        print("=== Checking Apartment 39 Status ===")
        
        # Check if apartment 39 exists
        cursor.execute("""
            SELECT id, site_id, block_name, unit_number, owner_user_id, current_resident_id, status
            FROM apartments 
            WHERE unit_number = '39'
        """)
        
        apartments = cursor.fetchall()
        
        if apartments:
            print(f"Found {len(apartments)} apartment(s) with unit number 39:")
            for apt in apartments:
                print(f"  - ID: {apt['id']}")
                print(f"    Site ID: {apt['site_id']}")
                print(f"    Block: {apt['block_name']}")
                print(f"    Unit: {apt['unit_number']}")
                print(f"    Owner: {apt['owner_user_id']}")
                print(f"    Current Resident: {apt['current_resident_id']}")
                print(f"    Status: {apt['status']}")
                print()
        else:
            print("No apartment with unit number 39 found")
        
        # Check the unique constraint
        cursor.execute("""
            SHOW CREATE TABLE apartments
        """)
        
        result = cursor.fetchone()
        print("=== Apartments Table Structure ===")
        print(result['Create Table'])
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")
        return False
    
    return True

if __name__ == "__main__":
    check_apartment_39()