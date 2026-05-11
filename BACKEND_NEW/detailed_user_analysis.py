#!/usr/bin/env python3
"""
Detaylı kullanıcı analizi - 97 kullanıcının site dağılımı
"""
import mysql.connector

# Database connection
conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)

cursor = conn.cursor(dictionary=True)

print("=" * 80)
print("DETAYLI KULLANICI ANALİZİ")
print("=" * 80)

# Toplam kullanıcı sayısı (silinmemiş)
cursor.execute("SELECT COUNT(*) as total FROM users WHERE is_deleted = FALSE")
total_users = cursor.fetchone()['total']
print(f"\n📊 Toplam Kullanıcı: {total_users}")

# Aktif üyelikleri olan kullanıcılar
cursor.execute("""
    SELECT COUNT(DISTINCT user_id) as total 
    FROM user_site_memberships 
    WHERE is_deleted = FALSE AND status = 'aktif'
""")
users_with_membership = cursor.fetchone()['total']
print(f"📊 Aktif Üyeliği Olan Kullanıcı: {users_with_membership}")
print(f"📊 Üyeliği Olmayan Kullanıcı: {total_users - users_with_membership}")

# Her site için detaylı kullanıcı listesi
print("\n" + "=" * 80)
print("SİTE BAZINDA DETAYLI KULLANICI LİSTESİ")
print("=" * 80)

cursor.execute("""
    SELECT 
        s.id as site_id,
        s.name as site_name,
        u.id as user_id,
        u.full_name,
        u.email,
        usm.role_type,
        usm.user_type,
        usm.status
    FROM sites s
    LEFT JOIN user_site_memberships usm ON s.id = usm.site_id 
        AND usm.is_deleted = FALSE
    LEFT JOIN users u ON usm.user_id = u.id 
        AND u.is_deleted = FALSE
    WHERE s.is_deleted = FALSE
    ORDER BY s.name, u.full_name
""")

current_site = None
user_count = 0
site_totals = {}

for row in cursor.fetchall():
    if current_site != row['site_name']:
        if current_site is not None:
            print(f"\n   ➡️  Toplam: {user_count} kullanıcı")
            site_totals[current_site] = user_count
        
        current_site = row['site_name']
        user_count = 0
        print(f"\n{'=' * 80}")
        print(f"🏢 {current_site}")
        print(f"   Site ID: {row['site_id']}")
        print(f"{'=' * 80}")
    
    if row['user_id']:
        user_count += 1
        print(f"\n   {user_count}. 👤 {row['full_name']}")
        print(f"      📧 {row['email']}")
        print(f"      🎭 Rol: {row['role_type']} | Tip: {row['user_type']} | Durum: {row['status']}")

if current_site is not None:
    print(f"\n   ➡️  Toplam: {user_count} kullanıcı")
    site_totals[current_site] = user_count

# Özet
print("\n" + "=" * 80)
print("ÖZET")
print("=" * 80)

for site_name, count in site_totals.items():
    print(f"   🏢 {site_name}: {count} kullanıcı")

print(f"\n   📊 Toplam Üyelik: {sum(site_totals.values())}")
print(f"   📊 Üyeliği Olmayan: {total_users - users_with_membership}")
print(f"   📊 Genel Toplam: {total_users}")

# Yeşil Vadi Sitesi özel analizi
print("\n" + "=" * 80)
print("YEŞİL VADİ SİTESİ ÖZEL ANALİZİ")
print("=" * 80)

cursor.execute("""
    SELECT 
        usm.role_type,
        usm.user_type,
        COUNT(*) as count
    FROM user_site_memberships usm
    INNER JOIN sites s ON usm.site_id = s.id
    WHERE s.name = 'Yeşil Vadi Sitesi'
        AND usm.is_deleted = FALSE
        AND usm.status = 'aktif'
    GROUP BY usm.role_type, usm.user_type
    ORDER BY count DESC
""")

print("\nRol ve Tip Dağılımı:")
for row in cursor.fetchall():
    print(f"   {row['role_type']} - {row['user_type']}: {row['count']} kullanıcı")

cursor.close()
conn.close()
