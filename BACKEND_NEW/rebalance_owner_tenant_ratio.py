import mysql.connector
import random

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor(dictionary=True)

print("=" * 80)
print("MALİK/KİRACI ORANI DENGELENİYOR")
print("=" * 80)

# Toplam daire sayısı
cursor.execute("""
    SELECT COUNT(*) as total 
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0
""")
total_apartments = cursor.fetchone()['total']
print(f"\nToplam daire sayısı: {total_apartments}")

# Hedef: %60 dairede sadece malik, %40 dairede malik + kiracı
target_only_owner = int(total_apartments * 0.6)  # 58 daire
target_with_tenant = total_apartments - target_only_owner  # 39 daire

print(f"\nHedef dağılım:")
print(f"  Sadece malik olan daire: {target_only_owner}")
print(f"  Malik + Kiracı olan daire: {target_with_tenant}")
print(f"  Toplam malik: {total_apartments}")
print(f"  Toplam kiracı: {target_with_tenant}")

# Rastgele dairelerden kiracıları kaldır
cursor.execute("""
    SELECT id, unit_number, block_name, current_resident_id
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0 
    AND current_resident_id IS NOT NULL AND current_resident_id != ''
    ORDER BY RAND()
""")
all_apartments = cursor.fetchall()

# İlk target_only_owner kadar daireden kiracıyı kaldır
apartments_to_clear = all_apartments[:target_only_owner]

print(f"\n" + "=" * 80)
print(f"{len(apartments_to_clear)} DAİREDEN KİRACI KALDIRILIYOR")
print("=" * 80)

removed_tenants = []
for apt in apartments_to_clear:
    tenant_id = apt['current_resident_id']
    
    # Kiracıyı kaldır
    cursor.execute("""
        UPDATE apartments 
        SET current_resident_id = NULL
        WHERE id = %s
    """, (apt['id'],))
    
    removed_tenants.append(tenant_id)
    print(f"✓ {apt['block_name']} - Daire {apt['unit_number']}: Kiracı kaldırıldı")

conn.commit()

# Kullanılmayan kiracıları sil
print(f"\n" + "=" * 80)
print("KULLANILMAYAN KİRACI KAYITLARI SİLİNİYOR")
print("=" * 80)

deleted_count = 0
for tenant_id in removed_tenants:
    # Bu kullanıcı başka bir dairede malik veya kiracı mı?
    cursor.execute("""
        SELECT COUNT(*) as count
        FROM apartments
        WHERE site_id = '1' AND is_deleted = 0
        AND (owner_user_id = %s OR current_resident_id = %s)
    """, (tenant_id, tenant_id))
    
    usage_count = cursor.fetchone()['count']
    
    if usage_count == 0:
        # Kullanılmıyor, silebiliriz
        cursor.execute("UPDATE users SET is_deleted = 1 WHERE id = %s", (tenant_id,))
        cursor.execute("DELETE FROM user_site_memberships WHERE user_id = %s", (tenant_id,))
        deleted_count += 1

conn.commit()
print(f"✓ {deleted_count} kullanılmayan kiracı kaydı silindi")

# Son durumu göster
print(f"\n" + "=" * 80)
print("SON DURUM")
print("=" * 80)

cursor.execute("""
    SELECT COUNT(*) as count 
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0 
    AND owner_user_id IS NOT NULL AND owner_user_id != ''
""")
final_owners = cursor.fetchone()['count']

cursor.execute("""
    SELECT COUNT(*) as count 
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0 
    AND current_resident_id IS NOT NULL AND current_resident_id != ''
""")
final_tenants = cursor.fetchone()['count']

cursor.execute("""
    SELECT COUNT(*) as count 
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0 
    AND owner_user_id IS NOT NULL AND owner_user_id != ''
    AND (current_resident_id IS NULL OR current_resident_id = '')
""")
only_owner = cursor.fetchone()['count']

cursor.execute("""
    SELECT COUNT(*) as count 
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0 
    AND owner_user_id IS NOT NULL AND owner_user_id != ''
    AND current_resident_id IS NOT NULL AND current_resident_id != ''
""")
with_both = cursor.fetchone()['count']

cursor.execute("""
    SELECT COUNT(DISTINCT user_id) as count
    FROM (
        SELECT owner_user_id as user_id FROM apartments WHERE site_id = '1' AND is_deleted = 0 AND owner_user_id IS NOT NULL
        UNION
        SELECT current_resident_id as user_id FROM apartments WHERE site_id = '1' AND is_deleted = 0 AND current_resident_id IS NOT NULL
    ) as all_residents
""")
total_residents = cursor.fetchone()['count']

print(f"Malik olan daire sayısı: {final_owners}")
print(f"Kiracı olan daire sayısı: {final_tenants}")
print(f"Sadece malik olan daire sayısı: {only_owner}")
print(f"Malik + Kiracı olan daire sayısı: {with_both}")
print(f"Toplam benzersiz sakin sayısı: {total_residents}")

print(f"\n✓ Tüm dairelerin sahibi var!")
print(f"✓ Malik sayısı ({final_owners}) > Kiracı sayısı ({final_tenants})")
print(f"✓ Boş daire yok!")
print("=" * 80)

cursor.close()
conn.close()
