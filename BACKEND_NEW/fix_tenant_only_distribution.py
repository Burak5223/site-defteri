import mysql.connector
import random

# Veritabanı bağlantısı
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor()

print("=== Kiracı Dağılımını Düzeltme ===\n")

# Her blok için daire sayısını al
cursor.execute("""
    SELECT b.id, b.name, COUNT(a.id) as apartment_count
    FROM blocks b
    JOIN apartments a ON a.block_id = b.id
    WHERE b.site_id = 1
    GROUP BY b.id, b.name
    ORDER BY b.name
""")
blocks = cursor.fetchall()

for block_id, block_name, apartment_count in blocks:
    print(f"\n{block_name} - {apartment_count} daire")
    
    # Bu bloktaki tüm daireleri al
    cursor.execute("""
        SELECT id, unit_number
        FROM apartments
        WHERE block_id = %s
        ORDER BY unit_number
    """, (block_id,))
    apartments = cursor.fetchall()
    
    # Yaklaşık %60 dairede kiracı olsun, %40'ında sadece malik
    # Örnek: 34 daire varsa, 20 dairede kiracı, 14 dairede sadece malik
    tenant_count = int(apartment_count * 0.6)
    
    # Rastgele kiracı olacak daireleri seç
    apartments_with_tenants = random.sample(apartments, tenant_count)
    tenant_apartment_ids = [apt[0] for apt in apartments_with_tenants]
    
    print(f"  - {tenant_count} dairede kiracı olacak")
    print(f"  - {apartment_count - tenant_count} dairede sadece malik olacak")
    
    # Önce bu bloktaki TÜM kiracıları sil
    cursor.execute("""
        DELETE am FROM apartment_memberships am
        JOIN apartments a ON am.apartment_id = a.id
        WHERE a.block_id = %s AND am.is_owner = FALSE
    """, (block_id,))
    deleted_tenants = cursor.rowcount
    print(f"  - {deleted_tenants} kiracı silindi")
    
    # Seçilen dairelere kiracı ekle
    added_tenants = 0
    for apt_id, apt_num in apartments:
        if apt_id in tenant_apartment_ids:
            # Bu dairenin malikini bul
            cursor.execute("""
                SELECT user_id FROM apartment_memberships
                WHERE apartment_id = %s AND is_owner = TRUE
                LIMIT 1
            """, (apt_id,))
            owner_result = cursor.fetchone()
            
            if owner_result:
                owner_id = owner_result[0]
                
                # Kiracı kullanıcısı oluştur
                cursor.execute("""
                    INSERT INTO users (phone_number, password, full_name, role, created_at)
                    VALUES (%s, '$2a$10$N9qo8uLOickgx2ZMRZoMye', %s, 'RESIDENT', NOW())
                """, (
                    f"555{block_id:02d}{apt_num:02d}2",
                    f"{block_name} {apt_num} Kiracı"
                ))
                tenant_id = cursor.lastrowid
                
                # Site üyeliği ekle
                cursor.execute("""
                    INSERT INTO site_memberships (user_id, site_id, role, joined_at)
                    VALUES (%s, 1, 'RESIDENT', NOW())
                """, (tenant_id,))
                
                # Daire üyeliği ekle (kiracı olarak)
                cursor.execute("""
                    INSERT INTO apartment_memberships (user_id, apartment_id, is_owner, joined_at)
                    VALUES (%s, %s, FALSE, NOW())
                """, (tenant_id, apt_id))
                
                added_tenants += 1
    
    print(f"  - {added_tenants} yeni kiracı eklendi")
    
    # Kontrol: Bu bloktaki güncel durum
    cursor.execute("""
        SELECT 
            COUNT(DISTINCT am.user_id) as total_residents,
            SUM(CASE WHEN am.is_owner = TRUE THEN 1 ELSE 0 END) as owners,
            SUM(CASE WHEN am.is_owner = FALSE THEN 1 ELSE 0 END) as tenants
        FROM apartment_memberships am
        JOIN apartments a ON am.apartment_id = a.id
        WHERE a.block_id = %s
    """, (block_id,))
    
    total, owners, tenants = cursor.fetchone()
    print(f"  ✓ Sonuç: {total} sakin ({owners} malik, {tenants} kiracı)")

conn.commit()

print("\n=== Genel Özet ===")
cursor.execute("""
    SELECT 
        b.name,
        COUNT(DISTINCT a.id) as apartments,
        COUNT(DISTINCT am.user_id) as residents,
        SUM(CASE WHEN am.is_owner = TRUE THEN 1 ELSE 0 END) as owners,
        SUM(CASE WHEN am.is_owner = FALSE THEN 1 ELSE 0 END) as tenants
    FROM blocks b
    JOIN apartments a ON a.block_id = b.id
    LEFT JOIN apartment_memberships am ON am.apartment_id = a.id
    WHERE b.site_id = 1
    GROUP BY b.id, b.name
    ORDER BY b.name
""")

for row in cursor.fetchall():
    block_name, apts, residents, owners, tenants = row
    print(f"{block_name}: {apts} daire, {residents} sakin ({owners} malik, {tenants} kiracı)")

cursor.close()
conn.close()

print("\n✓ Kiracı dağılımı düzeltildi!")
