#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test script to check user's apartments
"""

import mysql.connector
import sys

def test_user_apartments():
    try:
        # Database connection
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='12345678',
            database='smart_site_management'
        )
        cursor = conn.cursor(dictionary=True)
        
        # Get sakin user (test user)
        cursor.execute("""
            SELECT id, full_name, email, apartment_id 
            FROM users 
            WHERE email = 'sakin@test.com'
        """)
        user = cursor.fetchone()
        
        if not user:
            print("❌ Sakin user not found")
            return
        
        print(f"✅ User found: {user['full_name']} ({user['email']})")
        print(f"   Current apartment_id: {user['apartment_id']}")
        
        # Get all apartments where user is owner or resident
        cursor.execute("""
            SELECT 
                a.id,
                a.unit_number,
                a.floor,
                b.name as block_name,
                b.id as block_id,
                a.owner_user_id,
                a.current_resident_id,
                CASE 
                    WHEN a.owner_user_id = %s THEN 1
                    ELSE 0
                END as is_owner,
                CASE 
                    WHEN a.id = %s THEN 1
                    ELSE 0
                END as is_current
            FROM apartments a
            JOIN blocks b ON a.block_id = b.id
            WHERE a.owner_user_id = %s 
               OR a.current_resident_id = %s
               AND a.is_deleted = 0
            ORDER BY b.name, a.unit_number
        """, (user['id'], user['apartment_id'], user['id'], user['id']))
        
        apartments = cursor.fetchall()
        
        print(f"\n📍 Found {len(apartments)} apartment(s) for this user:")
        for apt in apartments:
            current_marker = "✓ CURRENT" if apt['is_current'] else ""
            owner_marker = "👑 Owner" if apt['is_owner'] else "🏠 Tenant"
            print(f"   - {apt['block_name']} - Daire {apt['unit_number']} (Floor {apt['floor']}) {owner_marker} {current_marker}")
            print(f"     ID: {apt['id']}")
        
        cursor.close()
        conn.close()
        
        return apartments
        
    except mysql.connector.Error as err:
        print(f"❌ Database error: {err}")
        return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

if __name__ == "__main__":
    test_user_apartments()
