#!/usr/bin/env python3
"""
Kapsamlı güvenlik ve yetkilendirme kontrolü
- Site bazlı erişim kontrolü
- Rol bazlı erişim kontrolü
- Malik/Kiracı ayrımı
- Mesajlaşma güvenliği
"""

import mysql.connector
from datetime import datetime

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor()

print("=" * 80)
print("KAPSAMLI GÜVENLİK VE YETKİLENDİRME KONTROLÜ")
print("=" * 80)

# 1. Kullanıcı Rolleri ve Site İlişkileri
print("\n1. KULLANICI ROLLERİ VE SİTE İLİŞKİLERİ:")
cursor.execute("""
    SELECT 
        u.id,
        u.full_name,
        u.email,
        GROUP_CONCAT(DISTINCT r.name) as roles,
        u.site_id,
        s.name as site_name,
        GROUP_CONCAT(DISTINCT sm.site_id) as member_sites
    FROM users u
    LEFT JOIN sites s ON u.site_id = s.id
    LEFT JOIN site_memberships sm ON u.id = sm.user_id
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    WHERE u.is_deleted = 0
    GROUP BY u.id, u.full_name, u.email, u.site_id, s.name
    ORDER BY u.full_name
""")

users = cursor.fetchall()
print(f"\nToplam {len(users)} aktif kullanıcı:")

role_counts = {}
for user in users:
    roles = user[3] or 'ROL YOK'
    for role in roles.split(','):
        role_counts[role] = role_counts.get(role, 0) + 1
    print(f"  • {user[1]} ({user[2]})")
    print(f"    Roller: {roles}, Ana Site: {user[5] or 'YOK'}, Üye Siteler: {user[6] or 'YOK'}")

print(f"\nRol Dağılımı:")
for role, count in sorted(role_counts.items()):
    print(f"  {role}: {count} kullanıcı")

# 2. Residency Tablosu - Malik/Kiracı Kontrolü
print("\n2. MALİK/KİRACI AYIRIMI:")
cursor.execute("""
    SELECT 
        r.user_id,
        u.full_name,
        u.email,
        r.apartment_id,
        a.unit_number,
        b.name as block_name,
        r.residency_type,
        r.is_owner,
        r.is_tenant
    FROM residency r
    JOIN users u ON r.user_id = u.id
    JOIN apartments a ON r.apartment_id = a.id
    JOIN blocks b ON a.block_id = b.id
    WHERE r.is_deleted = 0 AND u.is_deleted = 0
    ORDER BY r.residency_type, u.full_name
""")

residencies = cursor.fetchall()
print(f"\nToplam {len(residencies)} aktif ikamet kaydı:")

owner_count = sum(1 for r in residencies if r[7])  # is_owner
tenant_count = sum(1 for r in residencies if r[8])  # is_tenant

print(f"  Malik: {owner_count}")
print(f"  Kiracı: {tenant_count}")

print("\nÖrnek kayıtlar:")
for r in residencies[:5]:
    print(f"  • {r[1]} - {r[5]} Blok, Daire {r[4]}")
    print(f"    Tip: {r[6]}, Malik: {r[7]}, Kiracı: {r[8]}")

# 3. Mesajlaşma Güvenliği
print("\n3. MESAJLAŞMA GÜVENLİĞİ:")
cursor.execute("""
    SELECT 
        m.id,
        sender.full_name as sender_name,
        sender.site_id as sender_site,
        receiver.full_name as receiver_name,
        receiver.site_id as receiver_site,
        m.message_type,
        m.created_at
    FROM messages m
    JOIN users sender ON m.sender_id = sender.id
    LEFT JOIN users receiver ON m.receiver_id = receiver.id
    WHERE m.is_deleted = 0
    ORDER BY m.created_at DESC
    LIMIT 10
""")

messages = cursor.fetchall()
print(f"\nSon 10 mesaj:")

cross_site_messages = 0
for msg in messages:
    sender_site = msg[2]
    receiver_site = msg[4]
    
    if receiver_site and sender_site != receiver_site:
        cross_site_messages += 1
        print(f"  ⚠ ÇAPRAZ SİTE MESAJI: {msg[1]} (Site {sender_site}) -> {msg[3]} (Site {receiver_site})")
    else:
        print(f"  ✓ {msg[1]} -> {msg[3] or 'Genel'} ({msg[5]})")

if cross_site_messages > 0:
    print(f"\n⚠ UYARI: {cross_site_messages} çapraz site mesajı bulundu!")
else:
    print(f"\n✓ Tüm mesajlar aynı site içinde")

# 4. Duyuru Erişimi
print("\n4. DUYURU ERİŞİMİ:")
cursor.execute("""
    SELECT 
        a.id,
        a.title,
        a.site_id,
        s.name as site_name,
        a.priority,
        a.created_at
    FROM announcements a
    JOIN sites s ON a.site_id = s.id
    WHERE a.is_deleted = 0
    ORDER BY a.created_at DESC
    LIMIT 5
""")

announcements = cursor.fetchall()
print(f"\nSon 5 duyuru:")
for ann in announcements:
    print(f"  • {ann[1]} (Site: {ann[3]}, Öncelik: {ann[4]})")

# 5. Aidat Erişimi
print("\n5. AİDAT ERİŞİMİ:")
cursor.execute("""
    SELECT 
        d.id,
        d.apartment_id,
        a.unit_number,
        b.name as block_name,
        a.site_id,
        d.amount,
        d.status,
        d.due_date
    FROM dues d
    JOIN apartments a ON d.apartment_id = a.id
    JOIN blocks b ON a.block_id = b.id
    WHERE d.is_deleted = 0
    ORDER BY d.due_date DESC
    LIMIT 5
""")

dues = cursor.fetchall()
print(f"\nSon 5 aidat kaydı:")
for due in dues:
    print(f"  • {due[3]} Blok, Daire {due[2]} (Site {due[4]}): {due[5]} TL - {due[6]}")

# 6. Arıza/Talep Erişimi
print("\n6. ARIZA/TALEP ERİŞİMİ:")
cursor.execute("""
    SELECT 
        t.id,
        t.title,
        u.full_name as creator,
        u.site_id,
        t.status,
        t.priority,
        t.created_at
    FROM tickets t
    JOIN users u ON t.created_by = u.id
    WHERE t.is_deleted = 0
    ORDER BY t.created_at DESC
    LIMIT 5
""")

tickets = cursor.fetchall()
print(f"\nSon 5 arıza/talep:")
for ticket in tickets:
    print(f"  • {ticket[1]} (Oluşturan: {ticket[2]}, Site: {ticket[3]}, Durum: {ticket[4]})")

# 7. Paket Erişimi
print("\n7. PAKET ERİŞİMİ:")
cursor.execute("""
    SELECT 
        p.id,
        p.apartment_id,
        a.unit_number,
        b.name as block_name,
        a.site_id,
        p.status,
        p.created_at
    FROM packages p
    JOIN apartments a ON p.apartment_id = a.id
    JOIN blocks b ON a.block_id = b.id
    WHERE p.is_deleted = 0
    ORDER BY p.created_at DESC
    LIMIT 5
""")

packages = cursor.fetchall()
print(f"\nSon 5 paket kaydı:")
for pkg in packages:
    print(f"  • {pkg[3]} Blok, Daire {pkg[2]} (Site {pkg[4]}): {pkg[5]}")

# 8. Görev Erişimi
print("\n8. GÖREV ERİŞİMİ:")
cursor.execute("""
    SELECT 
        t.id,
        t.title,
        t.assigned_to,
        u.full_name as assigned_user,
        GROUP_CONCAT(DISTINCT r.name) as roles,
        t.site_id,
        t.status
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    WHERE t.is_deleted = 0
    GROUP BY t.id, t.title, t.assigned_to, u.full_name, t.site_id, t.status
    ORDER BY t.created_at DESC
    LIMIT 10
""")

tasks = cursor.fetchall()
print(f"\nSon 10 görev:")
for task in tasks:
    assigned_user = task[3] or 'Atanmamış'
    user_roles = task[4] or 'Rol yok'
    print(f"  • {task[1]}")
    print(f"    Atanan: {assigned_user} ({user_roles}), Site: {task[5]}, Durum: {task[6]}")

# 9. Özet ve Öneriler
print("\n" + "=" * 80)
print("ÖZET VE ÖNERİLER:")
print("=" * 80)

print("\n✓ MEVCUT GÜVENLİK ÖZELLİKLERİ:")
print("  1. Site bazlı kullanıcı yönetimi (site_id)")
print("  2. Site üyelikleri (site_memberships)")
print("  3. Rol bazlı yetkilendirme (ADMIN, RESIDENT, SECURITY, CLEANING)")
print("  4. Malik/Kiracı ayrımı (residency tablosu)")
print("  5. Soft delete (is_deleted)")

print("\n⚠ KONTROL EDİLMESİ GEREKENLER:")
print("  1. Tüm endpoint'lerde site_id kontrolü")
print("  2. Mesajlaşmada çapraz site kontrolü")
print("  3. Duyuru, aidat, arıza erişiminde site filtresi")
print("  4. Paket erişiminde apartment->site kontrolü")
print("  5. Görev atamalarında site kontrolü")
print("  6. Malik/Kiracı bazlı özel yetkiler")

print("\n📋 ÖNERİLEN İYİLEŞTİRMELER:")
print("  1. Backend'de tüm service'lerde site_id kontrolü ekle")
print("  2. JWT token'da site_id bilgisi zaten var, kullan")
print("  3. Mesajlaşmada sadece aynı site kullanıcıları görünsün")
print("  4. Malik'lere özel yetkiler (ödeme yapma, vb.)")
print("  5. Kiracılara sınırlı erişim")

cursor.close()
conn.close()

print("\n" + "=" * 80)
print("✓ Kontrol tamamlandı!")
print("=" * 80)
