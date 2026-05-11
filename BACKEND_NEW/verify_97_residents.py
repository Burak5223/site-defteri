#!/usr/bin/env python3
"""
97 kişilik verinin doğruluğunu kontrol et
"""
import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)

cursor = conn.cursor(dictionary=True)

site_id = "1"

print("=" * 80)
print("97 KISILIK VERI DOGRULAMA")
print("=" * 80)

# Toplam sakin sayısı
cursor.execute("""
    SELECT COUNT(*) as count
    FROM user_site_memberships
    WHERE site_id = %s AND role_type = 'sakin' AND is_deleted = FALSE AND status = 'aktif'
""", (site_id,))
total_residents = cursor.fetchone()['count']
print(f"\nToplam Sakin: {total_residents}")

# Toplam daire sayısı
cursor.execute("""
    SELECT COUNT(*) as count
    FROM apartments
    WHERE site_id = %s AND is_deleted = FALSE
""", (site_id,))
total_apartments = cursor.fetchone()['count']
print(f"Toplam Daire: {total_apartments}")

# Dolu daire sayısı
cursor.execute("""
    SELECT COUNT(*) as count
    FROM apartments
    WHERE site_id = %s AND current_resident_id IS NOT NULL AND is_deleted = FALSE
""", (site_id,))
occupied_apartments = cursor.fetchone()['count']
print(f"Dolu Daire: {occupied_apartments}")

# Blok bazında dağılım
print("\nBlok Bazinda Dagilim:")
cursor.execute("""
    SELECT 
        b.name,
        COUNT(DISTINCT a.id) as apartment_count,
        COUNT(DISTINCT a.current_resident_id) as resident_count
    FROM blocks b
    LEFT JOIN apartments a ON b.id = a.block_id AND a.is_deleted = FALSE
    WHERE b.site_id = %s
    GROUP BY b.id, b.name
    ORDER BY b.name
""", (site_id,))

for row in cursor.fetchall():
    print(f"   {row['name']} Blok: {row['apartment_count']} daire, {row['resident_count']} sakin")

# Kullanıcı tipi dağılımı
print("\nKullanici Tipi:")
cursor.execute("""
    SELECT user_type, COUNT(*) as count
    FROM user_site_memberships
    WHERE site_id = %s AND role_type = 'sakin' AND is_deleted = FALSE AND status = 'aktif'
    GROUP BY user_type
""", (site_id,))

for row in cursor.fetchall():
    print(f"   {row['user_type']}: {row['count']} kisi")

# Mesajlaşma için hazır mı?
print("\nMesajlasma Icin Hazirlik:")
cursor.execute("""
    SELECT COUNT(*) as count
    FROM apartments a
    INNER JOIN user_site_memberships usm ON a.current_resident_id = usm.user_id
    WHERE a.site_id = %s 
        AND usm.site_id = %s
        AND usm.is_deleted = FALSE 
        AND usm.status = 'aktif'
        AND a.is_deleted = FALSE
""", (site_id, site_id))

messaging_ready = cursor.fetchone()['count']
print(f"   Mesajlasmaya hazir daire: {messaging_ready}")

if messaging_ready == total_residents:
    print("   DURUM: Tum sakinler mesajlasmaya hazir!")
else:
    print(f"   UYARI: {total_residents - messaging_ready} sakin mesajlasmaya hazir degil")

print("\n" + "=" * 80)

cursor.close()
conn.close()
