import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

cursor.execute("UPDATE users SET password_hash = '123456' WHERE email = 'temizlik@site.com'")
conn.commit()

print("✅ Temizlikçi şifresi '123456' olarak güncellendi (plain text)")

cursor.close()
conn.close()
