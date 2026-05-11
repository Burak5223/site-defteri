#!/usr/bin/env python3
"""
Check Expenses Table Structure
"""

import mysql.connector
from mysql.connector import Error

def check_expenses_table():
    """Expenses tablosunun yapısını kontrol et"""
    
    try:
        connection = mysql.connector.connect(
            host='localhost',
            database='smart_site_management',
            user='root',
            password='Hilton5252.'
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            
            print("🔍 Checking Expenses Table Structure...")
            
            cursor.execute("DESCRIBE expenses")
            columns = cursor.fetchall()
            
            print("\n📋 Expenses Table Columns:")
            for column in columns:
                print(f"  {column[0]}: {column[1]} - {column[2]} - {column[3]} - {column[4]} - {column[5]}")
            
            # Mevcut bir expense kaydını kontrol et
            cursor.execute("SELECT * FROM expenses WHERE site_id = '1' LIMIT 1")
            sample = cursor.fetchone()
            
            if sample:
                print(f"\n📄 Sample Expense Record:")
                cursor.execute("SHOW COLUMNS FROM expenses")
                column_names = [desc[0] for desc in cursor.fetchall()]
                
                for i, value in enumerate(sample):
                    print(f"  {column_names[i]}: {value}")
            
    except Error as e:
        print(f"❌ Database error: {e}")
    
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    check_expenses_table()