import mysql.connector

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

print("=== SAKİN KULLANICI TELEFON GÜNCELLEME ===\n")

# Update phone number for sakin@site.com
cursor.execute("""
    UPDATE users 
    SET phone = '5551234567'
    WHERE email = 'sakin@site.com'
""")

conn.commit()
print(f"✓ Telefon numarası güncellendi: {cursor.rowcount} satır etkilendi")

# Verify
cursor.execute("""
    SELECT full_name, email, phone
    FROM users 
    WHERE email = 'sakin@site.com'
""")

user = cursor.fetchone()
if user:
    print(f"\n✓ Güncel kullanıcı bilgileri:")
    print(f"  Ad: {user[0]}")
    print(f"  Email: {user[1]}")
    print(f"  Telefon: {user[2]}")

cursor.close()
conn.close()

print("\n✓ İşlem tamamlandı!")
