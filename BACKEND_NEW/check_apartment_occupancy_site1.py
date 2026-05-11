#!/usr/bin/env python3

import mysql.connector

def check_apartment_occupancy_site1():
    """Check apartment occupancy in site 1 to understand the issue"""
    
    try:
        # Database connection
        connection = mysql.connector.connect(
            host='localhost',
            database='smart_site_management',
            user='root',
            password='Hilton5252.'
        )
        
        cursor = connection.cursor()
        
        # Check total apartments in site 1
        print("🏠 Checking apartments in site 1...")
        cursor.execute("""
            SELECT COUNT(*) FROM apartments a 
            JOIN blocks b ON a.block_id = b.id 
            WHERE b.site_id = '1'
        """)
        total_apartments = cursor.fetchone()[0]
        print(f"📊 Total apartments in site 1: {total_apartments}")
        
        # Check apartments with both owner and tenant
        cursor.execute("""
            SELECT COUNT(*) FROM apartments a 
            JOIN blocks b ON a.block_id = b.id 
            WHERE b.site_id = '1' 
            AND a.owner_user_id IS NOT NULL 
            AND a.current_resident_id IS NOT NULL
        """)
        both_occupied = cursor.fetchone()[0]
        print(f"📊 Apartments with both owner and tenant: {both_occupied}")
        
        # Check apartments with only owner
        cursor.execute("""
            SELECT COUNT(*) FROM apartments a 
            JOIN blocks b ON a.block_id = b.id 
            WHERE b.site_id = '1' 
            AND a.owner_user_id IS NOT NULL 
            AND a.current_resident_id IS NULL
        """)
        only_owner = cursor.fetchone()[0]
        print(f"📊 Apartments with only owner: {only_owner}")
        
        # Check apartments with only tenant
        cursor.execute("""
            SELECT COUNT(*) FROM apartments a 
            JOIN blocks b ON a.block_id = b.id 
            WHERE b.site_id = '1' 
            AND a.owner_user_id IS NULL 
            AND a.current_resident_id IS NOT NULL
        """)
        only_tenant = cursor.fetchone()[0]
        print(f"📊 Apartments with only tenant: {only_tenant}")
        
        # Check empty apartments
        cursor.execute("""
            SELECT COUNT(*) FROM apartments a 
            JOIN blocks b ON a.block_id = b.id 
            WHERE b.site_id = '1' 
            AND a.owner_user_id IS NULL 
            AND a.current_resident_id IS NULL
        """)
        empty_apartments = cursor.fetchone()[0]
        print(f"📊 Empty apartments: {empty_apartments}")
        
        # Show some examples of apartments with both owner and tenant
        print(f"\n🔍 Examples of apartments with both owner and tenant:")
        cursor.execute("""
            SELECT a.unit_number, b.name as block_name, 
                   u1.full_name as owner_name, u2.full_name as tenant_name
            FROM apartments a 
            JOIN blocks b ON a.block_id = b.id 
            LEFT JOIN users u1 ON a.owner_user_id = u1.id
            LEFT JOIN users u2 ON a.current_resident_id = u2.id
            WHERE b.site_id = '1' 
            AND a.owner_user_id IS NOT NULL 
            AND a.current_resident_id IS NOT NULL
            LIMIT 10
        """)
        examples = cursor.fetchall()
        
        for example in examples:
            print(f"   {example[1]} {example[0]} - Owner: {example[2]}, Tenant: {example[3]}")
        
        print(f"\n📈 Summary:")
        print(f"   Total apartments: {total_apartments}")
        print(f"   Both owner+tenant: {both_occupied}")
        print(f"   Only owner: {only_owner}")
        print(f"   Only tenant: {only_tenant}")
        print(f"   Empty: {empty_apartments}")
        print(f"   Total people: {both_occupied * 2 + only_owner + only_tenant}")
        
        return {
            'total_apartments': total_apartments,
            'both_occupied': both_occupied,
            'only_owner': only_owner,
            'only_tenant': only_tenant,
            'empty_apartments': empty_apartments
        }
        
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
    check_apartment_occupancy_site1()