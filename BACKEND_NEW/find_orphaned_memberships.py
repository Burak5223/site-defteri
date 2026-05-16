#!/usr/bin/env python3
"""
Find orphaned records in user_site_memberships table
"""
import mysql.connector
from mysql.connector import Error

def find_orphaned_memberships():
    try:
        connection = mysql.connector.connect(
            host='localhost',
            database='smart_site_management',
            user='root',
            password='Hilton5252.'
        )
        
        if connection.is_connected():
            cursor = connection.cursor(dictionary=True)
            
            print("=== Finding Orphaned Memberships ===\n")
            
            # Find memberships with non-existent user_id
            query = """
            SELECT usm.id, usm.user_id, usm.site_id, usm.role_type, s.name as site_name
            FROM user_site_memberships usm
            LEFT JOIN users u ON usm.user_id = u.id
            LEFT JOIN sites s ON usm.site_id = s.id
            WHERE u.id IS NULL
            """
            
            cursor.execute(query)
            orphaned = cursor.fetchall()
            
            if orphaned:
                print(f"Found {len(orphaned)} orphaned membership(s):\n")
                for record in orphaned:
                    print(f"Membership ID: {record['id']}")
                    print(f"  User ID (missing): {record['user_id']}")
                    print(f"  Site: {record['site_name']} ({record['site_id']})")
                    print(f"  Role: {record['role_type']}")
                    print()
            else:
                print("✓ No orphaned memberships found")
            
            cursor.close()
            return orphaned
            
    except Error as e:
        print(f"❌ Database error: {e}")
        return []
    finally:
        if connection.is_connected():
            connection.close()

if __name__ == "__main__":
    orphaned = find_orphaned_memberships()
    
    if orphaned:
        print("\n" + "=" * 60)
        print("ACTION REQUIRED:")
        print("=" * 60)
        print("Run cleanup script to delete these orphaned records")
