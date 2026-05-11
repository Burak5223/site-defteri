import mysql.connector
import json

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor(dictionary=True)

print("=" * 80)
print("BACKEND RESPONSE KONTROLÜ")
print("=" * 80)

# Backend'in döndüğü gibi veriyi simüle et
print("\n1. BLOK BAZINDA DAİRELER (Backend'in döndüğü gibi)")
cursor.execute("""
    SELECT 
        a.id,
        a.unit_number,
        a.block_name,
        a.floor,
        a.owner_user_id,
        a.current_resident_id,
        u1.full_name as owner_name,
        u2.full_name as tenant_name,
        (SELECT COUNT(*) 
         FROM user_site_memberships usm 
         WHERE usm.site_id = '1' 
         AND (usm.user_id = a.owner_user_id OR usm.user_id = a.current_resident_id)
        ) as resident_count
    FROM apartments a
    LEFT JOIN users u1 ON a.owner_user_id = u1.id
    LEFT JOIN users u2 ON a.current_resident_id = u2.id
    WHERE a.site_id = '1' AND a.is_deleted = 0
    ORDER BY a.block_name, CAST(a.unit_number AS UNSIGNED)
""")
apartments = cursor.fetchall()

# Blok bazında grupla
blocks = {}
for apt in apartments:
    block = apt['block_name']
    if block not in blocks:
        blocks[block] = []
    blocks[block].append(apt)

for block_name, apts in sorted(blocks.items()):
    print(f"\n{block_name}: {len(apts)} daire")
    print("  İlk 5 daire:")
    for apt in apts[:5]:
        owner = apt['owner_name'] if apt['owner_name'] else "YOK"
        tenant = f" + {apt['tenant_name']}" if apt['tenant_name'] else ""
        print(f"    Daire {apt['unit_number']}: {owner}{tenant} (Sakin sayısı: {apt['resident_count']})")

# 2. Sakin sayısı 0 olan daireleri kontrol et
print("\n" + "=" * 80)
print("2. SAKİN SAYISI 0 OLAN DAİRELER")
print("=" * 80)
cursor.execute("""
    SELECT 
        a.unit_number,
        a.block_name,
        a.owner_user_id,
        a.current_resident_id,
        u1.full_name as owner_name,
        u2.full_name as tenant_name
    FROM apartments a
    LEFT JOIN users u1 ON a.owner_user_id = u1.id
    LEFT JOIN users u2 ON a.current_resident_id = u2.id
    WHERE a.site_id = '1' AND a.is_deleted = 0
    AND NOT EXISTS (
        SELECT 1 FROM user_site_memberships usm 
        WHERE usm.site_id = '1' 
        AND (usm.user_id = a.owner_user_id OR usm.user_id = a.current_resident_id)
    )
    ORDER BY CAST(a.unit_number AS UNSIGNED)
    LIMIT 20
""")
zero_residents = cursor.fetchall()

if zero_residents:
    print(f"⚠️ {len(zero_residents)} dairede sakin görünmüyor:")
    for apt in zero_residents:
        print(f"  Daire {apt['unit_number']} ({apt['block_name']})")
        print(f"    owner_user_id: {apt['owner_user_id']}")
        print(f"    current_resident_id: {apt['current_resident_id']}")
        print(f"    owner_name: {apt['owner_name']}")
        print(f"    tenant_name: {apt['tenant_name']}")
else:
    print("✓ Tüm dairelerde sakin var")

# 3. user_site_memberships kontrolü
print("\n" + "=" * 80)
print("3. USER_SITE_MEMBERSHIPS KONTROLÜ")
print("=" * 80)
cursor.execute("""
    SELECT COUNT(DISTINCT user_id) as count
    FROM user_site_memberships
    WHERE site_id = '1'
""")
membership_count = cursor.fetchone()['count']
print(f"Site üyeliği olan kullanıcı: {membership_count}")

cursor.execute("""
    SELECT COUNT(DISTINCT id) as count
    FROM users
    WHERE site_id = '1' AND is_deleted = 0
""")
user_count = cursor.fetchone()['count']
print(f"Toplam kullanıcı: {user_count}")

# 4. Apartmanlarda kullanılan user_id'lerin üyelik durumu
print("\n" + "=" * 80)
print("4. APARTMANLARDA KULLANILAN USER_ID'LERİN ÜYELİK DURUMU")
print("=" * 80)
cursor.execute("""
    SELECT 
        u.id,
        u.full_name,
        CASE WHEN usm.id IS NOT NULL THEN 'VAR' ELSE 'YOK' END as membership_status
    FROM (
        SELECT owner_user_id as user_id FROM apartments WHERE site_id = '1' AND is_deleted = 0 AND owner_user_id IS NOT NULL
        UNION
        SELECT current_resident_id as user_id FROM apartments WHERE site_id = '1' AND is_deleted = 0 AND current_resident_id IS NOT NULL
    ) as apt_users
    JOIN users u ON apt_users.user_id = u.id
    LEFT JOIN user_site_memberships usm ON u.id = usm.user_id AND usm.site_id = '1'
    WHERE usm.id IS NULL
    LIMIT 10
""")
no_membership = cursor.fetchall()

if no_membership:
    print(f"⚠️ {len(no_membership)} kullanıcının site üyeliği YOK:")
    for user in no_membership:
        print(f"  {user['full_name']} (ID: {user['id'][:8]}...)")
else:
    print("✓ Tüm kullanıcıların site üyeliği var")

cursor.close()
conn.close()
