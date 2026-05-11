#!/usr/bin/env python3

import mysql.connector
from mysql.connector import Error

def check_apartment_table_structure():
    """Check the actual structure of apartments table"""
    
    connection = None
    try:
        # Database connection
        connection = mysql.connector.connect(
            host='localhost',
            database='smart_site_management',
            user='root',
            password='Hilton5252.'
        )
        
        if connection.is_connected():
            cursor = connection.cursor(dictionary=True)
            
            print("🔍 Checking Database Table Structures")
            print("=" * 50)
            
            # 1. Check apartments table structure
            print("\n1. Apartments table structure:")
            cursor.execute("DESCRIBE apartments")
            apt_columns = cursor.fetchall()
            
            for col in apt_columns:
                print(f"   - {col['Field']}: {col['Type']} ({col['Null']}, {col['Key']})")
            
            # 2. Check blocks table structure
            print("\n2. Blocks table structure:")
            cursor.execute("DESCRIBE blocks")
            block_columns = cursor.fetchall()
            
            for col in block_columns:
                print(f"   - {col['Field']}: {col['Type']} ({col['Null']}, {col['Key']})")
                
            # 3. Check dues table structure
            print("\n3. Dues table structure:")
            cursor.execute("DESCRIBE dues")
            due_columns = cursor.fetchall()
            
            for col in due_columns:
                print(f"   - {col['Field']}: {col['Type']} ({col['Null']}, {col['Key']})")
            
            # 4. Sample data from apartments
            print("\n4. Sample apartments data:")
            cursor.execute("SELECT * FROM apartments LIMIT 5")
            apartments = cursor.fetchall()
            
            for apt in apartments:
                print(f"   - {apt}")
                
            # 5. Sample data from blocks
            print("\n5. Sample blocks data:")
            cursor.execute("SELECT * FROM blocks LIMIT 5")
            blocks = cursor.fetchall()
            
            for block in blocks:
                print(f"   - {block}")
                
            # 6. Sample data from dues
            print("\n6. Sample dues data:")
            cursor.execute("SELECT * FROM dues LIMIT 5")
            dues = cursor.fetchall()
            
            for due in dues:
                print(f"   - {due}")
                
    except Error as e:
        print(f"❌ Database error: {e}")
        
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    check_apartment_table_structure()