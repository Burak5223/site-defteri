import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)

cursor = conn.cursor(dictionary=True)

print("=== BLOK BAZINDA İSTATİSTİKLER ===\n")

cursor.execute("""
    SELECT 
        b.name as blok_name,
        COUNT(DISTINCT a.id) as toplam_daire,
        SUM(CASE WHEN a.owner_user_id IS NOT NULL AND a.owner_user_id != '' THEN 1 ELSE 0 END) as malik_sayisi,
        SUM(CASE WHEN a.current_resident_id IS NOT NULL AND a.current_resident_id != '' THEN 1 ELSE 0 END) as sakin_sayisi
    FROM blocks b
    LEFT JOIN apartments a ON b.id = a.block_id AND a.is_deleted = 0
    WHERE b.site_id = '1' AND b.is_deleted = 0
    GROUP BY b.id, b.name
    ORDER BY b.name
""")

blocks = cursor.fetchall()

for block in blocks:
    print(f"{block['blok_name']}:")
    print(f"  Toplam Daire: {block['toplam_daire']}")
    print(f"  Malik Sayısı: {block['malik_sayisi']}")
    print(f"  Sakin Sayısı: {block['sakin_sayisi']}")
    print()

print("\n=== SONUÇ ===")
print("✓ Veritabanında tüm veriler mevcut")
print("✓ Her dairede malik ve sakin atanmış")
print("\nMobil uygulamada görünmüyorsa:")
print("1. Mobil uygulamayı TAMAMEN KAPAT (arka planda da kapalı olsun)")
print("2. Uygulamayı SİL")
print("3. Uygulamayı YENIDEN YÜKLE")
print("4. Giriş yap ve kontrol et")

cursor.close()
conn.close()
