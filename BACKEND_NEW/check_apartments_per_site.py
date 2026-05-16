import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)

cursor = conn.cursor()

# Site başına daire sayısı
cursor.execute('''
    SELECT 
        s.id,
        s.name,
        COUNT(a.id) as apartment_count
    FROM sites s
    LEFT JOIN apartments a ON s.id = a.site_id
    GROUP BY s.id, s.name
    ORDER BY s.name
''')

print("Site Başına Daire Sayısı:")
print("=" * 60)
total_apartments = 0
for row in cursor.fetchall():
    print(f"{row[1]}: {row[2]} daire")
    total_apartments += row[2]

print("=" * 60)
print(f"TOPLAM: {total_apartments} daire")

# Sakin sayısı
cursor.execute('''
    SELECT COUNT(DISTINCT user_id) 
    FROM user_site_memberships 
    WHERE role_type = 'RESIDENT'
''')
resident_count = cursor.fetchone()[0]
print(f"\nToplam Sakin: {resident_count}")
print(f"Doluluk Oranı: %{(resident_count / total_apartments * 100):.1f}")

conn.close()
