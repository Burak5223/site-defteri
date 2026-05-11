import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor(dictionary=True)

# Blocks tablosunun yapısını kontrol et
cursor.execute("DESCRIBE blocks")
print("Blocks tablosu yapısı:")
for col in cursor.fetchall():
    print(f"  {col['Field']}: {col['Type']}")

# Apartments tablosunun yapısını kontrol et
cursor.execute("DESCRIBE apartments")
print("\nApartments tablosu yapısı:")
for col in cursor.fetchall():
    print(f"  {col['Field']}: {col['Type']}")

cursor.close()
conn.close()
