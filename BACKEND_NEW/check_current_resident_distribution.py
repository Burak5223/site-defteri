import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor(dictionary=True)

print("=" * 80)
print("MEVCUT SAKİN DAĞILIMI")
print("=" * 80)

# Toplam daire sayısı
cursor.execute("""
    SELECT COUNT(*) as total 
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0
""")
total_apartments = cursor.fetchone()['total']
print(f"\nToplam daire sayısı: {total_apartments}")

# Malik olan daireler
cursor.execute("""
    SELECT COUNT(*) as count 
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0 
    AND owner_user_id IS NOT NULL AND owner_user_id != ''
""")
with_owner = cursor.fetchone()['count']
print(f"Malik olan daire sayısı: {with_owner}")

# Kiracı olan daireler
cursor.execute("""
    SELECT COUNT(*) as count 
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0 
    AND current_resident_id IS NOT NULL AND current_resident_id != ''
""")
with_tenant = cursor.fetchone()['count']
print(f"Kiracı olan daire sayısı: {with_tenant}")

# Hem malik hem kiracı olan daireler
cursor.execute("""
    SELECT COUNT(*) as count 
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0 
    AND owner_user_id IS NOT NULL AND owner_user_id != ''
    AND current_resident_id IS NOT NULL AND current_resident_id != ''
""")
with_both = cursor.fetchone()['count']
print(f"Hem malik hem kiracı olan daire sayısı: {with_both}")

# Sadece malik olan daireler
cursor.execute("""
    SELECT COUNT(*) as count 
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0 
    AND owner_user_id IS NOT NULL AND owner_user_id != ''
    AND (current_resident_id IS NULL OR current_resident_id = '')
""")
only_owner = cursor.fetchone()['count']
print(f"Sadece malik olan daire sayısı: {only_owner}")

# Sadece kiracı olan daireler
cursor.execute("""
    SELECT COUNT(*) as count 
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0 
    AND (owner_user_id IS NULL OR owner_user_id = '')
    AND current_resident_id IS NOT NULL AND current_resident_id != ''
""")
only_tenant = cursor.fetchone()['count']
print(f"Sadece kiracı olan daire sayısı: {only_tenant}")

# Boş daireler
cursor.execute("""
    SELECT COUNT(*) as count 
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0 
    AND (owner_user_id IS NULL OR owner_user_id = '')
    AND (current_resident_id IS NULL OR current_resident_id = '')
""")
empty = cursor.fetchone()['count']
print(f"Boş daire sayısı: {empty}")

# Toplam benzersiz sakin sayısı
cursor.execute("""
    SELECT COUNT(DISTINCT user_id) as count
    FROM (
        SELECT owner_user_id as user_id FROM apartments WHERE site_id = '1' AND is_deleted = 0 AND owner_user_id IS NOT NULL
        UNION
        SELECT current_resident_id as user_id FROM apartments WHERE site_id = '1' AND is_deleted = 0 AND current_resident_id IS NOT NULL
    ) as all_residents
""")
total_residents = cursor.fetchone()['count']
print(f"\nToplam benzersiz sakin sayısı: {total_residents}")

print("\n" + "=" * 80)
print("SONUÇ")
print("=" * 80)
if empty == 0 and with_owner == total_apartments:
    print("✓ Tüm dairelerin sahibi var!")
    print(f"✓ Malik sayısı ({with_owner}) > Kiracı sayısı ({with_tenant})")
else:
    print(f"✗ {empty} boş daire var")
    print(f"✗ {total_apartments - with_owner} dairenin sahibi yok")

print("=" * 80)

cursor.close()
conn.close()
