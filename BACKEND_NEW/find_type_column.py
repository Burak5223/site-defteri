import mysql.connector
from mysql.connector import Error

try:
    connection = mysql.connector.connect(
        host='localhost',
        database='smart_site_management',
        user='root',
        password='Hilton5252.'
    )
    
    if connection.is_connected():
        cursor = connection.cursor()
        
        # Check for 'type' column in packages table
        cursor.execute("""
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'smart_site_management' 
            AND TABLE_NAME = 'packages' 
            AND COLUMN_NAME = 'type'
        """)
        
        result = cursor.fetchall()
        if result:
            print("Found 'type' column in packages table:")
            for row in result:
                print(f"  Column: {row[0]}")
                print(f"  Type: {row[1]}")
                print(f"  Nullable: {row[2]}")
                print(f"  Default: {row[3]}")
        else:
            print("No 'type' column found in packages table")
        
        # Check all tables for 'type' column
        cursor.execute("""
            SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'smart_site_management' 
            AND COLUMN_NAME = 'type'
        """)
        
        result = cursor.fetchall()
        if result:
            print("\nAll tables with 'type' column:")
            for row in result:
                print(f"  Table: {row[0]}, Column: {row[1]}, Type: {row[2]}, Nullable: {row[3]}, Default: {row[4]}")
        
        cursor.close()
        connection.close()
        
except Error as e:
    print(f"Error: {e}")
