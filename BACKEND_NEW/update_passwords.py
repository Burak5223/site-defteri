import mysql.connector
from mysql.connector import Error
import bcrypt

def update_passwords():
    try:
        connection = mysql.connector.connect(
            host='localhost',
            database='smart_site_management',
            user='root',
            password='Hilton5252.'
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            
            # Şifreleri güncelle
            users = [
                ('guvenlik@site.com', 'guvenlik123'),
                ('temizlik@site.com', 'temizlik123')
            ]
            
            for email, password in users:
                # Yeni hash oluştur
                password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                
                # Güncelle
                cursor.execute("""
                    UPDATE users 
                    SET password_hash = %s 
                    WHERE email = %s
                """, (password_hash, email))
                
                print(f"✅ {email} şifresi güncellendi")
                print(f"   Şifre: {password}")
                print(f"   Hash: {password_hash}")
                print()
            
            connection.commit()
            print("✅ Tüm şifreler güncellendi!")
            
            cursor.close()
            connection.close()
            
    except Error as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    update_passwords()
