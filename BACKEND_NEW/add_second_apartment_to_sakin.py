#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Add a second apartment to sakin user for testing multi-apartment feature
"""

import mysql.connector
import sys

def add_second_apartment():
    try:
        # Database connection
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='',
            database='smart_site_management'
        )
        cursor = conn.cursor(dictionary=True)
        
        # Get sakin user
        cursor.execute("""
            SELECT id, full_name, email, apartment_id 
            FROM users 
            WHERE email = 'sakin@test.com'
        """)
        user = cursor.fetchone()
        
        if not user:
            print("❌ Sakin user not found")
            return
        
        print(f"✅ User found: {user['full_name']}")
        print(f"   Current apartment_id: {user['apartment_id']}")
        
        # Get current apartment details
        cursor.execute("""
            SELECT a.*, b.name as block_name
            FROM apartments a
            JOIN blocks b ON a.block_id = b.id
            WHERE a.id = %s
        """, (user['apartment_id'],))
        current_apt = cursor.fetchone()
        
        if current_apt:
            print(f"   Current: {current_apt['block_name']} - Daire {current_apt['unit_number']}")
        
        # Find another available apartment in a different block
        cursor.execute("""
            SELECT a.id, a.unit_number, a.floor, b.name as block_name, b.id as block_id
            FROM apartments a
            JOIN blocks b ON a.block_id = b.id
            WHERE a.is_deleted = 0
              AND b.site_id = '1'
              AND b.id != %s
              AND (a.owner_user_id IS NULL OR a.owner_user_id != %s)
            ORDER BY b.name, a.unit_number
            LIMIT 1
        """, (current_apt['block_id'] if current_apt else '', user['id']))
        
        second_apt = cursor.fetchone()
        
        if not second_apt:
            print("❌ No available apartment found for second ownership")
            return
        
        print(f"\n📍 Adding second apartment:")
        print(f"   {second_apt['block_name']} - Daire {second_apt['unit_number']} (Floor {second_apt['floor']})")
        
        # Set user as owner of the second apartment
        cursor.execute("""
            UPDATE apartments 
            SET owner_user_id = %s
            WHERE id = %s
        """, (user['id'], second_apt['id']))
        
        conn.commit()
        
        print(f"\n✅ Successfully added second apartment!")
        print(f"   User now owns 2 apartments:")
        
        # Show all apartments
        cursor.execute("""
            SELECT a.id, a.unit_number, b.name as block_name, a.floor,
                   CASE WHEN a.id = %s THEN 1 ELSE 0 END as is_current
            FROM apartments a
            JOIN blocks b ON a.block_id = b.id
            WHERE a.owner_user_id = %s OR a.current_resident_id = %s
            ORDER BY b.name, a.unit_number
        """, (user['apartment_id'], user['id'], user['id']))
        
        all_apts = cursor.fetchall()
        for apt in all_apts:
            current_marker = "✓ CURRENT" if apt['is_current'] else ""
            print(f"   - {apt['block_name']} - Daire {apt['unit_number']} {current_marker}")
        
        cursor.close()
        conn.close()
        
    except mysql.connector.Error as err:
        print(f"❌ Database error: {err}")
        return
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return

if __name__ == "__main__":
    add_second_apartment()
