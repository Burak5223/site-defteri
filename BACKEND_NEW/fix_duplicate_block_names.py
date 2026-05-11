import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor()

# "A Blok" -> "A", "B Blok" -> "B" gibi düzeltmeler
cursor.execute("UPDATE blocks SET name = 'A' WHERE name LIKE 'A%Blok%'")
cursor.execute("UPDATE blocks SET name = 'B' WHERE name LIKE 'B%Blok%'")
cursor.execute("UPDATE blocks SET name = 'C' WHERE name LIKE 'C%Blok%'")

conn.commit()
print(f"✓ Blok adları düzeltildi")

# Apartments tablosunu da güncelle
cursor.execute("UPDATE apartments SET block_name = 'A' WHERE block_name LIKE 'A%Blok%'")
cursor.execute("UPDATE apartments SET block_name = 'B' WHERE block_name LIKE 'B%Blok%'")
cursor.execute("UPDATE apartments SET block_name = 'C' WHERE block_name LIKE 'C%Blok%'")

conn.commit()
print(f"✓ Daire blok adları düzeltildi")

cursor.close()
conn.close()
