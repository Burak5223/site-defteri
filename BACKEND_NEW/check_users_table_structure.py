#!/usr/bin/env python3
"""
Check users table structure
"""
import mysql.connector
from mysql.connector import Error

def check_users_table():
    try:
        connection = mysql.connector.connect(
            host='localhost',
            database='smart_site_management',
            user='root',
            password='Hilton5252.'
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            
            print("=== Users Table Structure ===\n")
            
            cursor.execute("DESCRIBE users")
            columns = cursor.fetchall()
            
            for col in columns:
                print(f"{col[0]}: {col[1]}")
            
            print("\n=== Super Admin User ===\n")
            
            cursor.execute("""
                SELECT * FROM users WHERE email = 'superadmin@site.com'
            """)
            
            user = cursor.fetchone()
            
            if user:
                print("✓ Super Admin found")
                cursor.execute("DESCRIBE users")
                columns = [col[0] for col in cursor.fetchall()]
                
                for i, col_name in enumerate(columns):
                    print(f"{col_name}: {user[i]}")
            else:
                print("❌ Super Admin NOT found")
            
            cursor.close()
            
    except Error as e:
        print(f"❌ Database error: {e}")
    finally:
        if connection.is_connected():
            connection.close()

if __name__ == "__main__":
    check_users_table()
