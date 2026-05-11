#!/usr/bin/env python3

import mysql.connector

def check_blocks_table():
    """Check the blocks table to understand the site_id issue"""
    
    try:
        # Database connection
        connection = mysql.connector.connect(
            host='localhost',
            database='smart_site_management',
            user='root',
            password='Hilton5252.'
        )
        
        cursor = connection.cursor()
        
        # Check blocks table
        print("🧱 Checking blocks table...")
        cursor.execute("SELECT id, name, site_id FROM blocks")
        blocks = cursor.fetchall()
        
        print(f"📋 Found {len(blocks)} blocks:")
        for block in blocks:
            print(f"   ID: {block[0]}")
            print(f"   Name: {block[1]}")
            print(f"   Site ID: {block[2]}")
            print("   ---")
        
        # Check apartment-block relationship
        print("\n🏠 Checking apartment-block relationship for apartment 39...")
        cursor.execute("""
            SELECT a.id, a.unit_number, a.site_id as apt_site_id, 
                   b.id as block_id, b.name as block_name, b.site_id as block_site_id
            FROM apartments a 
            LEFT JOIN blocks b ON a.block_id = b.id 
            WHERE a.unit_number = '39'
            LIMIT 5
        """)
        apt_39_data = cursor.fetchall()
        
        print(f"📊 Apartment 39 data:")
        for apt in apt_39_data:
            print(f"   Apartment ID: {apt[0]}")
            print(f"   Unit Number: {apt[1]}")
            print(f"   Apartment site_id: {apt[2]}")
            print(f"   Block ID: {apt[3]}")
            print(f"   Block Name: {apt[4]}")
            print(f"   Block site_id: {apt[5]}")
            print("   ---")
        
        # Check if blocks have site_id = "1"
        print("\n🔍 Checking blocks with site_id = '1'...")
        cursor.execute("SELECT id, name FROM blocks WHERE site_id = '1'")
        site1_blocks = cursor.fetchall()
        
        print(f"📋 Blocks with site_id = '1': {len(site1_blocks)}")
        for block in site1_blocks:
            print(f"   Block ID: {block[0]}, Name: {block[1]}")
        
        return blocks, apt_39_data, site1_blocks
        
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
    check_blocks_table()