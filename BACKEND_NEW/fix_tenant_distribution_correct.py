import mysql.connector
import random

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
    SELECT DISTINCT block_name
    FROM apartments
    WHERE site_id = '1' AND is_deleted = 0
    ORDER BY block_name
""")
blocks = [row[0] for row in cursor.fetchall()]

for block_name in blocks:
    print(f"\n{block_name}")
    
    # Bu bloktaki tüm daireleri al
    cursor.execute("""
        SELECT id, unit_number, owner_user_id, current_resident_id
        FROM apartments
        WHERE block_name = %s AND is_deleted = 0
        ORDER BY CAST(unit_number AS UNSIGNED)
    """, (block_name,))
    apartments = cursor.fetchall()
    
    apartment_count = len(apartments)
    print(f"  Toplam {apartment_count} daire")
    
    # Yaklaşık %60 dairede kiracı olsun, %40'ında sadece malik
    tenant_count = int(apartment_count * 0.6)
    
    # Rastgele kiracı olacak daireleri seç
    apartments_with_tenants = random.sample(apartments, tenant_count)
    tenant_apartment_ids = [apt[0] for apt in apartments_with_tenants]
    
    print(f"  - {tenant_count} dairede kiracı olacak")
    print(f"  - {apartment_count - tenant_count} dairede sadece malik olacak")
    
    # Her daire için işlem yap
    owners_count = 0
    tenants_count = 0
    
    for apt_id, unit_num, owner_id, current_resident_id in apartments:
        if apt_id in tenant_apartment_ids:
            # Bu dairede kiracı olacak
            # Eğer current_resident owner ile aynıysa, yeni kiracı oluştur
            if current_resident_id == owner_id or current_resident_id is None:
                # UUID oluştur
                import uuid
                tenant_id = str(uuid.uuid4())
                
                # Yeni kiracı kullanıcısı oluştur
                cursor.execute("""
                    INSERT INTO users (id, full_name, email, phone, site_id, password_hash, status, email_verified, phone_verified, created_at)
                    VALUES (%s, %s, %s, %s, '1', '$2a$10$N9qo8uLOickgx2ZMRZoMye', 'aktif', 1, 1, NOW())
                """, (
                    tenant_id,
                    f"{block_name} {unit_num} Kiracı",
                    f"{block_name.lower().replace(' ', '')}{unit_num}kiraci@test.com",
                    f"555{hash(block_name + unit_num) % 10000:04d}"
                ))
                
                # Dairenin current_resident'ını güncelle
                cursor.execute("""
                    UPDATE apartments
                    SET current_resident_id = %s, updated_at = NOW()
                    WHERE id = %s
                """, (tenant_id, apt_id))
                
                # Site üyeliği ekle (kiracı olarak)
                cursor.execute("""
                    INSERT INTO user_site_memberships (id, user_id, site_id, role_type, user_type, status, joined_at, created_at)
                    VALUES (UUID(), %s, '1', 'RESIDENT', 'kiraci', 'aktif', CURDATE(), NOW())
                """, (tenant_id,))
                
                tenants_count += 1
            else:
                # Zaten farklı bir kiracı var, olduğu gibi bırak
                tenants_count += 1
        else:
            # Bu dairede sadece malik olacak
            # current_resident'ı owner ile aynı yap
            if current_resident_id != owner_id:
                cursor.execute("""
                    UPDATE apartments
                    SET current_resident_id = %s, updated_at = NOW()
                    WHERE id = %s
                """, (owner_id, apt_id))
                
                # Eski kiracıyı sil (eğer varsa)
                if current_resident_id:
                    cursor.execute("""
                        UPDATE users
                        SET is_deleted = 1, deleted_at = NOW()
                        WHERE id = %s
                    """, (current_resident_id,))
                    
                    cursor.execute("""
                        UPDATE user_site_memberships
                        SET is_deleted = 1, deleted_at = NOW(), status = 'ayrildi', left_at = CURDATE()
                        WHERE user_id = %s
                    """, (current_resident_id,))
            
            owners_count += 1
    
    print(f"  ✓ {owners_count} dairede sadece malik")
    print(f"  ✓ {tenants_count} dairede kiracı var")

conn.commit()

print("\n=== Genel Özet ===")
cursor.execute("""
    SELECT 
        block_name,
        COUNT(*) as total_apartments,
        SUM(CASE WHEN owner_user_id = current_resident_id THEN 1 ELSE 0 END) as owner_only,
        SUM(CASE WHEN owner_user_id != current_resident_id THEN 1 ELSE 0 END) as with_tenant
    FROM apartments
    WHERE site_id = '1' AND is_deleted = 0
    GROUP BY block_name
    ORDER BY block_name
""")

for row in cursor.fetchall():
    block_name, total, owner_only, with_tenant = row
    print(f"{block_name}: {total} daire ({owner_only} sadece malik, {with_tenant} kiracılı)")

# Toplam sakin sayısını hesapla
cursor.execute("""
    SELECT 
        block_name,
        COUNT(DISTINCT owner_user_id) as owners,
        COUNT(DISTINCT CASE WHEN owner_user_id != current_resident_id THEN current_resident_id END) as tenants
    FROM apartments
    WHERE site_id = '1' AND is_deleted = 0
    GROUP BY block_name
    ORDER BY block_name
""")

print("\n=== Sakin Sayıları ===")
for row in cursor.fetchall():
    block_name, owners, tenants = row
    total = owners + tenants
    print(f"{block_name}: {total} sakin ({owners} malik, {tenants} kiracı)")

cursor.close()
conn.close()

print("\n✓ Kiracı dağılımı düzeltildi!")
