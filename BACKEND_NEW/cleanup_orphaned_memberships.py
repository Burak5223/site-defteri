#!/usr/bin/env python3
"""
Delete orphaned records in user_site_memberships table
"""
import mysql.connector
from mysql.connector import Error

def cleanup_orphaned_memberships():
    try:
        connection = mysql.connector.connect(
            host='localhost',
            database='smart_site_management',
            user='root',
            password='Hilton5252.'
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            
            print("=== Cleaning Up Orphaned Memberships ===\n")
            
            # Delete memberships with non-existent user_id
            delete_query = """
            DELETE FROM user_site_memberships
            WHERE user_id NOT IN (SELECT id FROM users)
            """
            
            cursor.execute(delete_query)
            deleted_count = cursor.rowcount
            
            connection.commit()
            
            print(f"✓ Deleted {deleted_count} orphaned membership record(s)")
            
            # Verify cleanup
            verify_query = """
            SELECT COUNT(*) as count
            FROM user_site_memberships usm
            LEFT JOIN users u ON usm.user_id = u.id
            WHERE u.id IS NULL
            """
            
            cursor.execute(verify_query)
            result = cursor.fetchone()
            remaining = result[0]
            
            if remaining == 0:
                print("✓ All orphaned records cleaned up successfully")
            else:
                print(f"⚠️  {remaining} orphaned record(s) still remain")
            
            cursor.close()
            
    except Error as e:
        print(f"❌ Database error: {e}")
    finally:
        if connection.is_connected():
            connection.close()

if __name__ == "__main__":
    cleanup_orphaned_memberships()
