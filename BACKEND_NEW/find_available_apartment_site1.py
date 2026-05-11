#!/usr/bin/env python3

import mysql.connector

def find_available_apartment_site1():
    """Find available apartments in site 1"""
    
    try:
        # Database connection
        connection = mysql.connector.connect(
            host='localhost',
            database='smart_site_management',
            user='root',
            password='Hilton5252.'
        )
        
        cursor = connection.cursor()
        
        # Find apartments in site 1 that don't have tenants
        print("🏠 Finding available apartments in site 1...")
        cursor.execute("""
            SELECT a.id, a.unit_number, b.name as block_name, 
                   a.owner_user_id, a.current_resident_id, a.status
            FROM apartments a 
            JOIN blocks b ON a.block_id = b.id 
            WHERE b.site_id = '1' 
            AND a.current_resident_id IS NULL
            ORDER BY b.name, CAST(a.unit_number AS UNSIGNED)
            LIMIT 10
        """)
        available_apartments = cursor.fetchall()
        
        print(f"📋 Found {len(available_apartments)} available apartments in site 1:")
        for apt in available_apartments:
            print(f"   {apt[2]} {apt[1]} - Owner: {apt[3]}, Tenant: {apt[4]}, Status: {apt[5]}")
        
        # Also check apartments that have owners but no tenants
        print("\n🏠 Apartments with owners but no tenants in site 1...")
        cursor.execute("""
            SELECT a.id, a.unit_number, b.name as block_name, 
                   a.owner_user_id, a.current_resident_id, a.status
            FROM apartments a 
            JOIN blocks b ON a.block_id = b.id 
            WHERE b.site_id = '1' 
            AND a.owner_user_id IS NOT NULL
            AND a.current_resident_id IS NULL
            ORDER BY b.name, CAST(a.unit_number AS UNSIGNED)
            LIMIT 5
        """)
        owner_no_tenant = cursor.fetchall()
        
        print(f"📋 Found {len(owner_no_tenant)} apartments with owners but no tenants:")
        for apt in owner_no_tenant:
            print(f"   {apt[2]} {apt[1]} - Owner: {apt[3]}, Tenant: {apt[4]}, Status: {apt[5]}")
        
        return available_apartments, owner_no_tenant
        
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
    find_available_apartment_site1()