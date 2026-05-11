import mysql.connector

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

print("=" * 80)
print("MESAJLAŞMA SİSTEMİNDEKİ DAİRE VE SAKİN SAYILARI")
print("=" * 80)

# Get apartment_messaging data
cursor.execute("""
    SELECT 
        b.name as block_name,
        COUNT(DISTINCT am.apartment_id) as apartment_count,
        COUNT(DISTINCT CASE WHEN am.is_owner = TRUE THEN am.user_id END) as owner_count,
        COUNT(DISTINCT CASE WHEN am.is_owner = FALSE THEN am.user_id END) as tenant_count
    FROM apartment_messaging am
    JOIN apartments a ON am.apartment_id = a.id
    JOIN blocks b ON a.block_id = b.id
    WHERE b.site_id = '1'
    GROUP BY b.id, b.name
    ORDER BY b.name
""")

results = cursor.fetchall()

total_apartments = 0
total_owners = 0
total_tenants = 0

for block_name, apt_count, owner_count, tenant_count in results:
    print(f"\n{block_name}:")
    print(f"  Daire Sayısı: {apt_count}")
    print(f"  Malik Sayısı: {owner_count}")
    print(f"  Kiracı Sayısı: {tenant_count}")
    
    total_apartments += apt_count
    total_owners += owner_count
    total_tenants += tenant_count

print("\n" + "=" * 80)
print("TOPLAM")
print("=" * 80)
print(f"Toplam Daire: {total_apartments}")
print(f"Toplam Malik: {total_owners}")
print(f"Toplam Kiracı: {total_tenants}")
print("=" * 80)

cursor.close()
conn.close()
