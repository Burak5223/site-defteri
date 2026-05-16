#!/usr/bin/env python3
"""
Fix super admin login - update password to super123
"""
import mysql.connector
from mysql.connector import Error

def fix_superadmin_login():
    try:
        connection = mysql.connector.connect(
            host='localhost',
            database='smart_site_management',
            user='root',
            password='Hilton5252.'
        )
        
        if connection.is_connected():
            cursor = connection.cursor(dictionary=True)
            
            print("=== Fixing Super Admin Login ===\n")
            
            # First, let's see what columns exist
            cursor.execute("SHOW COLUMNS FROM users")
            columns = cursor.fetchall()
            
            print("Users table columns:")
            for col in columns:
                print(f"  - {col['Field']}")
            
            # Find password column name
            password_col = None
            for col in columns:
                if 'password' in col['Field'].lower():
                    password_col = col['Field']
                    break
            
            if not password_col:
                print("\n❌ No password column found!")
                return
            
            print(f"\nPassword column: {password_col}")
            
            # Check current super admin
            query = f"SELECT id, email, {password_col}, full_name, status FROM users WHERE email = 'superadmin@site.com'"
            cursor.execute(query)
            user = cursor.fetchone()
            
            if user:
                # Check role
                cursor.execute("SELECT role_name FROM user_roles WHERE user_id = %s", (user['id'],))
                role_result = cursor.fetchone()
                role = role_result['role_name'] if role_result else 'NO_ROLE'
                
                print(f"\n✓ Super Admin found:")
                print(f"  Email: {user['email']}")
                print(f"  Role: {role}")
                print(f"  Current password hash: {user[password_col][:50]}...")
                
                # Update password to super123
                correct_hash = "$2b$12$IxY0P/YRuSRPsw.SAKO/1.dafM76/bOWwjZY7luRnL.gQfWQ3DFSi"
                
                update_query = f"UPDATE users SET {password_col} = %s WHERE email = 'superadmin@site.com'"
                cursor.execute(update_query, (correct_hash,))
                connection.commit()
                
                print(f"\n✓ Password updated to: super123")
                print(f"  New hash: {correct_hash}")
                
                # Verify
                cursor.execute(query)
                user = cursor.fetchone()
                print(f"\n✓ Verified - Current hash: {user[password_col][:50]}...")
                
            else:
                print("\n❌ Super Admin user NOT found!")
                print("Creating super admin user...")
                
                # Create super admin
                user_id = "1cd05f8e-9261-4eb7-94f6-b2372afe6be5"
                correct_hash = "$2b$12$IxY0P/YRuSRPsw.SAKO/1.dafM76/bOWwjZY7luRnL.gQfWQ3DFSi"
                
                insert_query = f"""
                    INSERT INTO users (id, email, {password_col}, full_name, status, is_deleted, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, NOW())
                """
                
                cursor.execute(insert_query, (
                    user_id,
                    'superadmin@site.com',
                    correct_hash,
                    'Super Admin User',
                    'aktif',
                    False
                ))
                
                # Add role
                cursor.execute("""
                    INSERT INTO user_roles (id, user_id, role_name, created_at)
                    VALUES (UUID(), %s, %s, NOW())
                """, (user_id, 'ROLE_SUPER_ADMIN'))
                
                connection.commit()
                
                print("✓ Super Admin created successfully")
            
            cursor.close()
            
            print("\n" + "="*60)
            print("CREDENTIALS:")
            print("="*60)
            print("Email: superadmin@site.com")
            print("Password: super123")
            
    except Error as e:
        print(f"❌ Database error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if connection.is_connected():
            connection.close()

if __name__ == "__main__":
    fix_superadmin_login()
