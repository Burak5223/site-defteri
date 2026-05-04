import mysql.connector

# Database bağlantısı
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

# Tablo yapısını göster
print("=== USERS TABLO YAPISI ===\n")
cursor.execute("DESCRIBE users")
columns = cursor.fetchall()

for col in columns:
    print(f"{col[0]}: {col[1]}")

print("\n=== GÜVENLIK VE TEMIZLIKÇI KULLANICILARI ===\n")
cursor.execute("SELECT * FROM users WHERE email IN ('guvenlik@site.com', 'temizlik@site.com')")
users = cursor.fetchall()

# Kolon isimlerini al
cursor.execute("SHOW COLUMNS FROM users")
column_names = [column[0] for column in cursor.fetchall()]

for user in users:
    for i, value in enumerate(user):
        print(f"{column_names[i]}: {value}")
    print("-" * 40)

cursor.close()
conn.close()
