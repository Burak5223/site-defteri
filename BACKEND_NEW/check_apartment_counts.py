import mysql.connector

# Veritabanı bağlantısı
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

print("=== APARTMENT COUNTS ===\n")

# 1. Toplam daire sayısı
cursor.execute("SELECT COUNT(*) FROM apartments")
total_apartments = cursor.fetchone()[0]
print(f"Total apartments: {total_apartments}")

# 2. Blok bazında daire sayıları
cursor.execute("""
    SELECT block_name, COUNT(*) as count
    FROM apartments
    GROUP BY block_name
    ORDER BY block_name
""")
block_counts = cursor.fetchall()
print("\nApartments by block:")
for block in block_counts:
    print(f"  {block[0]}: {block[1]} apartments")

# 3. Sakin atanmış daireler
cursor.execute("""
    SELECT COUNT(*) 
    FROM apartments 
    WHERE current_resident_id IS NOT NULL
""")
apartments_with_residents = cursor.fetchone()[0]
print(f"\nApartments with residents: {apartments_with_residents}")

# 4. Boş daireler
cursor.execute("""
    SELECT COUNT(*) 
    FROM apartments 
    WHERE current_resident_id IS NULL
""")
empty_apartments = cursor.fetchone()[0]
print(f"Empty apartments: {empty_apartments}")

cursor.close()
conn.close()

print("\n=== DONE ===")
