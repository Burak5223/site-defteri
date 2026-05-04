import mysql.connector
from mysql.connector import Error

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
            
            # Şifreleri plain text olarak güncelle (TEMPORARY - backend plain text kullanıyor)
            users = [
                ('guvenlik@site.com', 'guvenlik123'),
                ('temizlik@site.com', 'temizlik123')
            ]
            
            for email, password in users:
                # Plain text olarak güncelle
                cursor.execute("""
                    UPDATE users 
                    SET password_hash = %s 
                    WHERE email = %s
                """, (password, email))
                
                print(f"✅ {email} şifresi güncellendi (plain text)")
                print(f"   Şifre: {password}")
                print()
            
            connection.commit()
            print("✅ Tüm şifreler güncellendi!")
            print("⚠️  DİKKAT: Şifreler plain text olarak saklanıyor (güvenli değil!)")
            
            cursor.close()
            connection.close()
            
    except Error as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    update_passwords()
