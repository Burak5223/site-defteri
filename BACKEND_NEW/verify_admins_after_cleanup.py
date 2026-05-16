#!/usr/bin/env python3
"""
Verify each site has exactly 1 admin after cleanup
"""
import mysql.connector
from mysql.connector import Error

def verify_admins():
    try:
        connection = mysql.connector.connect(
            host='localhost',
            database='smart_site_management',
            user='root',
            password='Hilton5252.'
        )
        
        if connection.is_connected():
            cursor = connection.cursor(dictionary=True)
            
            print("=== Verifying Admin Users After Cleanup ===\n")
            
            # Get admin count per site
            query = """
            SELECT 
                s.id as site_id,
                s.name as site_name,
                COUNT(DISTINCT usm.user_id) as admin_count,
                GROUP_CONCAT(u.email SEPARATOR ', ') as admin_emails
            FROM sites s
            LEFT JOIN user_site_memberships usm ON s.id = usm.site_id AND usm.role_type = 'yonetici'
            LEFT JOIN users u ON usm.user_id = u.id
            GROUP BY s.id, s.name
            ORDER BY s.name
            """
            
            cursor.execute(query)
            sites = cursor.fetchall()
            
            sites_with_admin = 0
            sites_without_admin = 0
            
            for site in sites:
                admin_count = site['admin_count']
                status = "✓" if admin_count == 1 else "❌"
                
                print(f"{status} {site['site_name']}: {admin_count} admin(s)")
                if site['admin_emails']:
                    print(f"   Admins: {site['admin_emails']}")
                
                if admin_count > 0:
                    sites_with_admin += 1
                else:
                    sites_without_admin += 1
            
            print(f"\nTotal: {sites_with_admin} sites with admin, {sites_without_admin} sites without admin")
            
            cursor.close()
            
    except Error as e:
        print(f"❌ Database error: {e}")
    finally:
        if connection.is_connected():
            connection.close()

if __name__ == "__main__":
    verify_admins()
