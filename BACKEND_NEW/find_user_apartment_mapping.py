#!/usr/bin/env python3
"""
Find User-Apartment Mapping
Kullanıcı-apartment eşleşmesini nasıl bulacağımızı araştırır
"""

import mysql.connector
from mysql.connector import Error

def find_user_apartment_mapping():
    """Kullanıcı-apartment eşleşmesini bul"""
    
    try:
        connection = mysql.connector.connect(
            host='localhost',
            database='smart_site_management',
            user='root',
            password='Hilton5252.'
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            
            print("🔍 Finding User-Apartment Mapping...")
            
            # Tüm tabloları listele
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            
            # User veya apartment ile ilgili tabloları bul
            relevant_tables = []
            for table in tables:
                table_name = table[0]
                if any(keyword in table_name.lower() for keyword in ['user', 'apartment', 'resident', 'membership', 'residency']):
                    relevant_tables.append(table_name)
            
            print(f"\n📋 Relevant Tables: {relevant_tables}")
            
            # Her tabloyu kontrol et
            for table_name in relevant_tables:
                try:
                    cursor.execute(f"DESCRIBE {table_name}")
                    columns = cursor.fetchall()
                    
                    # User_id ve apartment_id içeren tabloları bul
                    has_user_id = any('user_id' in col[0].lower() for col in columns)
                    has_apartment_id = any('apartment_id' in col[0].lower() for col in columns)
                    
                    if has_user_id and has_apartment_id:
                        print(f"\n🎯 {table_name} - Has both user_id and apartment_id!")
                        
                        # Bu tablodaki kayıtları kontrol et
                        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                        count = cursor.fetchone()[0]
                        print(f"  Record count: {count}")
                        
                        if count > 0:
                            cursor.execute(f"SELECT * FROM {table_name} LIMIT 3")
                            samples = cursor.fetchall()
                            print("  Sample records:")
                            for sample in samples:
                                print(f"    {sample}")
                    
                    elif has_user_id or has_apartment_id:
                        print(f"\n📝 {table_name} - Has {'user_id' if has_user_id else 'apartment_id'}")
                        
                except Exception as e:
                    print(f"  Error checking {table_name}: {e}")
            
            # Alternatif: Users tablosunda apartment bilgisi var mı?
            print(f"\n🔍 Checking Users table for apartment info...")
            cursor.execute("DESCRIBE users")
            user_columns = cursor.fetchall()
            
            apartment_related = [col for col in user_columns if any(keyword in col[0].lower() for keyword in ['apartment', 'unit', 'block', 'residence'])]
            print(f"Apartment-related fields in users: {apartment_related}")
            
            # Sakin kullanıcısının bilgilerini kontrol et
            cursor.execute("SELECT * FROM users WHERE email LIKE '%sakin%' LIMIT 1")
            sakin_user = cursor.fetchone()
            
            if sakin_user:
                print(f"\n👤 Sample Sakin User:")
                cursor.execute("SHOW COLUMNS FROM users")
                column_names = [desc[0] for desc in cursor.fetchall()]
                
                for i, value in enumerate(sakin_user):
                    if value is not None and 'apartment' in column_names[i].lower():
                        print(f"  {column_names[i]}: {value}")
            
    except Error as e:
        print(f"❌ Database error: {e}")
    
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    find_user_apartment_mapping()