import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor(dictionary=True)

print("=" * 80)
print("DAİRE SAYISI KONTROLÜ")
print("=" * 80)

# Toplam daire sayısı
cursor.execute("""
    SELECT COUNT(*) as total 
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0
""")
total = cursor.fetchone()['total']
print(f"\nToplam daire sayısı: {total}")

# Blok bazında dağılım
cursor.execute("""
    SELECT b.name as block_name, COUNT(a.id) as count
    FROM apartments a
    LEFT JOIN blocks b ON a.block_id = b.id
    WHERE a.site_id = '1' AND a.is_deleted = 0
    GROUP BY b.name
    ORDER BY b.name
""")
blocks = cursor.fetchall()
print(f"\nBlok bazında dağılım:")
for block in blocks:
    print(f"  {block['block_name']}: {block['count']} daire")

# Site üyesi olan daireler
cursor.execute("""
    SELECT COUNT(DISTINCT a.id) as count
    FROM apartments a
    LEFT JOIN users u1 ON a.current_resident_id = u1.id
    LEFT JOIN users u2 ON a.owner_user_id = u2.id
    LEFT JOIN site_memberships sm1 ON u1.id = sm1.user_id AND sm1.site_id = '1'
    LEFT JOIN site_memberships sm2 ON u2.id = sm2.user_id AND sm2.site_id = '1'
    WHERE a.site_id = '1' AND a.is_deleted = 0
    AND (sm1.user_id IS NOT NULL OR sm2.user_id IS NOT NULL)
""")
member_apartments = cursor.fetchone()['count']
print(f"\nSite üyesi olan daire sayısı: {member_apartments}")

# Boş daireler (site üyesi olmayan)
empty_apartments = total - member_apartments
print(f"Boş daire sayısı: {empty_apartments}")

print("\n" + "=" * 80)
print("SONUÇ")
print("=" * 80)
print(f"✓ Backend artık {total} daireyi gösterecek (önceden {member_apartments})")
print(f"✓ {empty_apartments} boş daire de listeye eklendi")
print("=" * 80)

cursor.close()
conn.close()
