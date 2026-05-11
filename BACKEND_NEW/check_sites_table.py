#!/usr/bin/env python3

import mysql.connector

def check_sites_table():
    """Check the sites table to understand the correct site_id"""
    
    try:
        # Database connection
        connection = mysql.connector.connect(
            host='localhost',
            database='smart_site_management',
            user='root',
            password='Hilton5252.'
        )
        
        cursor = connection.cursor()
        
        # Check sites table
        print("🏢 Checking sites table...")
        cursor.execute("SELECT id, name, address FROM sites")
        sites = cursor.fetchall()
        
        print(f"📋 Found {len(sites)} sites:")
        for site in sites:
            print(f"   ID: {site[0]}")
            print(f"   Name: {site[1]}")
            print(f"   Address: {site[2]}")
            print("   ---")
        
        # Check user site memberships to see which site the admin belongs to
        print("\n👤 Checking admin user site memberships...")
        cursor.execute("""
            SELECT u.email, s.id, s.name, usm.role_type 
            FROM users u 
            JOIN user_site_memberships usm ON u.id = usm.user_id 
            JOIN sites s ON usm.site_id = s.id 
            WHERE u.email = 'admin@site.com'
        """)
        admin_memberships = cursor.fetchall()
        
        print(f"📋 Admin memberships:")
        for membership in admin_memberships:
            print(f"   Email: {membership[0]}")
            print(f"   Site ID: {membership[1]}")
            print(f"   Site Name: {membership[2]}")
            print(f"   Role: {membership[3]}")
            print("   ---")
        
        # Check apartment site_id distribution
        print("\n🏠 Checking apartment site_id distribution...")
        cursor.execute("SELECT site_id, COUNT(*) FROM apartments GROUP BY site_id")
        distributions = cursor.fetchall()
        
        print(f"📊 Apartment distribution by site_id:")
        for dist in distributions:
            print(f"   Site ID: {dist[0]} -> {dist[1]} apartments")
        
        return sites, admin_memberships, distributions
        
    except mysql.connector.Error as error:
        print(f"❌ Database error: {error}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
    finally:
        try:
            if 'connection' in locals() and connection.is_connected():
                cursor.close()
                connection.close()
                print("🔌 Database connection closed")
        except:
            pass

if __name__ == "__main__":
    check_sites_table()