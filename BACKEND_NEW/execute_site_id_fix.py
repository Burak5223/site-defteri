#!/usr/bin/env python3

import mysql.connector
import os

def execute_site_id_fix():
    """Execute SQL to fix apartment site_id fields"""
    
    try:
        # Database connection
        connection = mysql.connector.connect(
            host='localhost',
            database='smart_site_management',
            user='root',
            password='Hilton5252.'
        )
        
        cursor = connection.cursor()
        
        # Check current state
        print("🔍 Checking current apartment site_id status...")
        cursor.execute("SELECT COUNT(*) FROM apartments WHERE site_id IS NULL")
        null_count = cursor.fetchone()[0]
        print(f"   Apartments with null site_id: {null_count}")
        
        cursor.execute("SELECT COUNT(*) FROM apartments WHERE site_id = '1'")
        site1_count = cursor.fetchone()[0]
        print(f"   Apartments with site_id = '1': {site1_count}")
        
        cursor.execute("SELECT COUNT(*) FROM apartments")
        total_count = cursor.fetchone()[0]
        print(f"   Total apartments: {total_count}")
        
        # Show sample apartments
        print("\n📋 Sample apartments:")
        cursor.execute("SELECT id, unit_number, block_name, site_id FROM apartments LIMIT 5")
        samples = cursor.fetchall()
        for sample in samples:
            print(f"   Unit {sample[1]}: site_id = {sample[3]}")
        
        if null_count == 0:
            print("✅ All apartments already have site_id set")
            return
        
        # Execute the fix
        print(f"\n🔧 Updating {null_count} apartments to have site_id = '1'...")
        update_sql = "UPDATE apartments SET site_id = '1' WHERE site_id IS NULL"
        cursor.execute(update_sql)
        
        # Commit the changes
        connection.commit()
        updated_rows = cursor.rowcount
        print(f"✅ Successfully updated {updated_rows} apartments")
        
        # Verify the fix
        print("\n🔍 Verifying the fix...")
        cursor.execute("SELECT COUNT(*) FROM apartments WHERE site_id IS NULL")
        remaining_null = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM apartments WHERE site_id = '1'")
        final_site1_count = cursor.fetchone()[0]
        
        print(f"   Apartments with null site_id: {remaining_null}")
        print(f"   Apartments with site_id = '1': {final_site1_count}")
        
        if remaining_null == 0:
            print("✅ Fix completed successfully!")
        else:
            print(f"⚠️  Still {remaining_null} apartments with null site_id")
        
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
    execute_site_id_fix()