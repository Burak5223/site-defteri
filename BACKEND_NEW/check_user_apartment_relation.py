#!/usr/bin/env python3
"""
Check User-Apartment Relation
Kullanıcı-apartment ilişkisini kontrol eder
"""

import mysql.connector
from mysql.connector import Error

def check_user_apartment_relation():
    """Kullanıcı-apartment ilişkisini kontrol et"""
    
    try:
        connection = mysql.connector.connect(
            host='localhost',
            database='smart_site_management',
            user='root',
            password='Hilton5252.'
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            
            print("🔍 Checking User-Apartment Relations...")
            
            # Sakin kullanıcısını bul
            cursor.execute("SELECT id, full_name, email FROM users WHERE email LIKE '%sakin%' LIMIT 5")
            sakin_users = cursor.fetchall()
            
            print("\n👤 Sakin Users:")
            for user in sakin_users:
                print(f"  ID: {user[0][:8]}..., Name: {user[1]}, Email: {user[2]}")
            
            if sakin_users:
                sakin_user_id = sakin_users[0][0]
                print(f"\n🎯 Testing with user: {sakin_user_id}")
                
                # Residency tablosunu kontrol et
                cursor.execute("SHOW TABLES LIKE '%residency%'")
                residency_tables = cursor.fetchall()
                print(f"\nResidency tables: {residency_tables}")
                
                # Apartment_users tablosunu kontrol et
                cursor.execute("SHOW TABLES LIKE '%apartment%user%'")
                apartment_user_tables = cursor.fetchall()
                print(f"Apartment-user tables: {apartment_user_tables}")
                
                # Users tablosunda apartment_id field'ı var mı?
                cursor.execute("DESCRIBE users")
                user_columns = cursor.fetchall()
                apartment_fields = [col for col in user_columns if 'apartment' in col[0].lower()]
                print(f"\nUser apartment fields: {apartment_fields}")
                
                # Residency tablosu varsa kontrol et
                try:
                    cursor.execute("SELECT * FROM residency WHERE user_id = %s LIMIT 5", (sakin_user_id,))
                    residencies = cursor.fetchall()
                    print(f"\nUser residencies: {len(residencies)}")
                    for residency in residencies:
                        print(f"  {residency}")
                except:
                    print("\nNo residency table found")
                
                # Site membership tablosunu kontrol et
                try:
                    cursor.execute("SELECT * FROM site_membership WHERE user_id = %s", (sakin_user_id,))
                    memberships = cursor.fetchall()
                    print(f"\nUser site memberships: {len(memberships)}")
                    for membership in memberships:
                        print(f"  {membership}")
                except:
                    print("\nNo site_membership table found")
                
                # Dues tablosunda bu kullanıcının aidatlarını kontrol et
                cursor.execute("SELECT COUNT(*) FROM dues WHERE user_id = %s", (sakin_user_id,))
                user_dues_count = cursor.fetchone()[0]
                print(f"\nUser dues count: {user_dues_count}")
                
                if user_dues_count > 0:
                    cursor.execute("""
                        SELECT id, apartment_id, status, total_amount 
                        FROM dues 
                        WHERE user_id = %s 
                        ORDER BY created_at DESC 
                        LIMIT 5
                    """, (sakin_user_id,))
                    user_dues = cursor.fetchall()
                    print("User dues:")
                    for due in user_dues:
                        print(f"  ID: {due[0][:8]}..., Apartment: {due[1][:8]}..., Status: {due[2]}, Amount: ₺{due[3]}")
            
    except Error as e:
        print(f"❌ Database error: {e}")
    
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    check_user_apartment_relation()