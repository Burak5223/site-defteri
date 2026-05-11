#!/usr/bin/env python3
"""
Check Dues Table Structure
"""

import mysql.connector
from mysql.connector import Error

def check_dues_table():
    """Dues tablosunun yapısını kontrol et"""
    
    try:
        connection = mysql.connector.connect(
            host='localhost',
            database='smart_site_management',
            user='root',
            password='Hilton5252.'
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            
            print("🔍 Checking Dues Table Structure...")
            
            cursor.execute("DESCRIBE dues")
            columns = cursor.fetchall()
            
            print("\n📋 Dues Table Columns:")
            for column in columns:
                print(f"  {column[0]}: {column[1]} - {column[2]} - {column[3]} - {column[4]} - {column[5]}")
            
            # Sample due kaydını kontrol et
            cursor.execute("SELECT * FROM dues LIMIT 1")
            sample = cursor.fetchone()
            
            if sample:
                print(f"\n📄 Sample Due Record:")
                cursor.execute("SHOW COLUMNS FROM dues")
                column_names = [desc[0] for desc in cursor.fetchall()]
                
                for i, value in enumerate(sample):
                    print(f"  {column_names[i]}: {value}")
            
            # Apartment ile ilişkili dues'ları kontrol et
            cursor.execute("""
                SELECT d.id, d.apartment_id, d.status, d.total_amount, a.unit_number, a.block_name
                FROM dues d
                LEFT JOIN apartments a ON d.apartment_id = a.id
                WHERE d.apartment_id IS NOT NULL
                LIMIT 5
            """)
            
            dues_with_apartments = cursor.fetchall()
            print(f"\n🏠 Dues with Apartments:")
            for due in dues_with_apartments:
                print(f"  Due ID: {due[0][:8]}..., Apartment: {due[4]} ({due[5]}), Status: {due[2]}, Amount: ₺{due[3]}")
            
    except Error as e:
        print(f"❌ Database error: {e}")
    
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    check_dues_table()