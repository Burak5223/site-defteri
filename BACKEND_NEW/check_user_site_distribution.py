#!/usr/bin/env python3
"""
Kullanıcıların site dağılımını kontrol eden script
"""
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

# Database connection
conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)

cursor = conn.cursor(dictionary=True)

print("=" * 80)
print("KULLANICI - SİTE DAĞILIMI ANALİZİ")
print("=" * 80)

# Toplam kullanıcı sayısı
cursor.execute("SELECT COUNT(*) as total FROM users WHERE is_deleted = FALSE")
total_users = cursor.fetchone()['total']
print(f"\n📊 Toplam Kullanıcı Sayısı: {total_users}")

# Toplam site sayısı
cursor.execute("SELECT COUNT(*) as total FROM sites WHERE is_deleted = FALSE")
total_sites = cursor.fetchone()['total']
print(f"📊 Toplam Site Sayısı: {total_sites}")

# Site başına kullanıcı dağılımı
print("\n" + "=" * 80)
print("SİTE BAŞINA KULLANICI DAĞILIMI")
print("=" * 80)

cursor.execute("""
    SELECT 
        s.id,
        s.name,
        COUNT(DISTINCT usm.user_id) as user_count,
        GROUP_CONCAT(DISTINCT usm.role_type) as roles
    FROM sites s
    LEFT JOIN user_site_memberships usm ON s.id = usm.site_id 
        AND usm.is_deleted = FALSE 
        AND usm.status = 'aktif'
    WHERE s.is_deleted = FALSE
    GROUP BY s.id, s.name
    ORDER BY user_count DESC
""")

sites = cursor.fetchall()
for site in sites:
    print(f"\n🏢 Site: {site['name']}")
    print(f"   ID: {site['id']}")
    print(f"   👥 Kullanıcı Sayısı: {site['user_count']}")
    print(f"   🎭 Roller: {site['roles'] if site['roles'] else 'Yok'}")

# Birden fazla siteye üye olan kullanıcılar
print("\n" + "=" * 80)
print("ÇOKLU SİTE ÜYELİKLERİ")
print("=" * 80)

cursor.execute("""
    SELECT 
        u.id,
        u.full_name,
        u.email,
        COUNT(DISTINCT usm.site_id) as site_count,
        GROUP_CONCAT(DISTINCT s.name SEPARATOR ', ') as site_names
    FROM users u
    INNER JOIN user_site_memberships usm ON u.id = usm.user_id 
        AND usm.is_deleted = FALSE 
        AND usm.status = 'aktif'
    INNER JOIN sites s ON usm.site_id = s.id AND s.is_deleted = FALSE
    WHERE u.is_deleted = FALSE
    GROUP BY u.id, u.full_name, u.email
    HAVING site_count > 1
    ORDER BY site_count DESC
""")

multi_site_users = cursor.fetchall()
if multi_site_users:
    print(f"\n⚠️  Birden fazla siteye üye {len(multi_site_users)} kullanıcı bulundu:")
    for user in multi_site_users:
        print(f"\n👤 {user['full_name']} ({user['email']})")
        print(f"   Üye olduğu site sayısı: {user['site_count']}")
        print(f"   Siteler: {user['site_names']}")
else:
    print("\n✅ Birden fazla siteye üye kullanıcı yok")

# Hiçbir siteye üye olmayan kullanıcılar
print("\n" + "=" * 80)
print("SİTESİZ KULLANICILAR")
print("=" * 80)

cursor.execute("""
    SELECT 
        u.id,
        u.full_name,
        u.email,
        u.status
    FROM users u
    LEFT JOIN user_site_memberships usm ON u.id = usm.user_id 
        AND usm.is_deleted = FALSE 
        AND usm.status = 'aktif'
    WHERE u.is_deleted = FALSE
        AND usm.id IS NULL
    ORDER BY u.created_at DESC
""")

no_site_users = cursor.fetchall()
if no_site_users:
    print(f"\n⚠️  Hiçbir siteye üye olmayan {len(no_site_users)} kullanıcı bulundu:")
    for user in no_site_users:
        print(f"   👤 {user['full_name']} ({user['email']}) - Durum: {user['status']}")
else:
    print("\n✅ Tüm kullanıcılar en az bir siteye üye")

# Rol dağılımı
print("\n" + "=" * 80)
print("ROL DAĞILIMI")
print("=" * 80)

cursor.execute("""
    SELECT 
        role_type,
        COUNT(*) as count
    FROM user_site_memberships
    WHERE is_deleted = FALSE AND status = 'aktif'
    GROUP BY role_type
    ORDER BY count DESC
""")

roles = cursor.fetchall()
for role in roles:
    print(f"   {role['role_type']}: {role['count']} kullanıcı")

# Kullanıcı tipi dağılımı
print("\n" + "=" * 80)
print("KULLANICI TİPİ DAĞILIMI")
print("=" * 80)

cursor.execute("""
    SELECT 
        user_type,
        COUNT(*) as count
    FROM user_site_memberships
    WHERE is_deleted = FALSE AND status = 'aktif'
    GROUP BY user_type
    ORDER BY count DESC
""")

user_types = cursor.fetchall()
for utype in user_types:
    print(f"   {utype['user_type']}: {utype['count']} üyelik")

print("\n" + "=" * 80)

cursor.close()
conn.close()
