#!/usr/bin/env python3
"""
Mesajlaşma site üyeliği kontrolü test scripti
"""
import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)

cursor = conn.cursor(dictionary=True)

print("=" * 80)
print("MESAJLAŞMA SİTE ÜYELİĞİ KONTROLÜ")
print("=" * 80)

# Test senaryosu: Yeşil Vadi Sitesi (ID: 1)
site_id = "1"
site_name = "Yeşil Vadi Sitesi"

print(f"\n🏢 Test Sitesi: {site_name} (ID: {site_id})")

# Bu sitedeki tüm mesajları kontrol et
cursor.execute("""
    SELECT 
        m.id,
        m.sender_id,
        u.full_name as sender_name,
        u.email as sender_email,
        m.chat_type,
        m.body,
        CASE 
            WHEN usm.id IS NOT NULL THEN 'ÜYE'
            ELSE 'ÜYE DEĞİL'
        END as membership_status
    FROM messages m
    LEFT JOIN users u ON m.sender_id = u.id
    LEFT JOIN user_site_memberships usm ON m.sender_id = usm.user_id 
        AND m.site_id = usm.site_id
        AND usm.is_deleted = FALSE
        AND usm.status = 'aktif'
    WHERE m.site_id = %s
    ORDER BY m.created_at DESC
""", (site_id,))

messages = cursor.fetchall()

print(f"\n📊 Toplam Mesaj: {len(messages)}")

# Üye olan ve olmayan mesajları ayır
member_messages = [m for m in messages if m['membership_status'] == 'ÜYE']
non_member_messages = [m for m in messages if m['membership_status'] == 'ÜYE DEĞİL']

print(f"   ✅ Site üyesi tarafından gönderilen: {len(member_messages)}")
print(f"   ❌ Site üyesi OLMAYAN tarafından gönderilen: {len(non_member_messages)}")

if non_member_messages:
    print("\n⚠️  SİTE ÜYESİ OLMAYAN KULLANICILARIN MESAJLARI:")
    for msg in non_member_messages:
        print(f"\n   Mesaj ID: {msg['id']}")
        print(f"   Gönderen: {msg['sender_name']} ({msg['sender_email']})")
        print(f"   Chat Type: {msg['chat_type']}")
        print(f"   İçerik: {msg['body'][:50]}...")
        print(f"   Durum: {msg['membership_status']}")

# Daire bazlı mesajlaşma için kontrol
print("\n" + "=" * 80)
print("DAİRE BAZLI MESAJLAŞMA KONTROLÜ")
print("=" * 80)

cursor.execute("""
    SELECT 
        a.id as apartment_id,
        a.unit_number,
        a.current_resident_id,
        u.full_name as resident_name,
        u.email as resident_email,
        CASE 
            WHEN usm.id IS NOT NULL THEN 'ÜYE'
            ELSE 'ÜYE DEĞİL'
        END as membership_status
    FROM apartments a
    INNER JOIN blocks b ON a.block_id = b.id
    LEFT JOIN users u ON a.current_resident_id = u.id
    LEFT JOIN user_site_memberships usm ON a.current_resident_id = usm.user_id 
        AND b.site_id = usm.site_id
        AND usm.is_deleted = FALSE
        AND usm.status = 'aktif'
    WHERE b.site_id = %s
        AND a.current_resident_id IS NOT NULL
    ORDER BY a.unit_number
""", (site_id,))

apartments = cursor.fetchall()

print(f"\n📊 Sakin olan daire sayısı: {len(apartments)}")

member_apartments = [a for a in apartments if a['membership_status'] == 'ÜYE']
non_member_apartments = [a for a in apartments if a['membership_status'] == 'ÜYE DEĞİL']

print(f"   ✅ Sakini site üyesi olan: {len(member_apartments)}")
print(f"   ❌ Sakini site üyesi OLMAYAN: {len(non_member_apartments)}")

if non_member_apartments:
    print("\n⚠️  SAKİNİ SİTE ÜYESİ OLMAYAN DAİRELER:")
    for apt in non_member_apartments:
        print(f"\n   Daire: {apt['unit_number']}")
        print(f"   Sakin: {apt['resident_name']} ({apt['resident_email']})")
        print(f"   Durum: {apt['membership_status']}")

# Öneriler
print("\n" + "=" * 80)
print("ÖNERİLER")
print("=" * 80)

if non_member_messages:
    print(f"\n⚠️  {len(non_member_messages)} mesaj site üyesi olmayan kullanıcılar tarafından gönderilmiş.")
    print("   Bu mesajlar artık filtrelenecek ve gösterilmeyecek.")

if non_member_apartments:
    print(f"\n⚠️  {len(non_member_apartments)} dairenin sakini site üyesi değil.")
    print("   Bu daireler mesajlaşma listesinde gösterilmeyecek.")
    print("\n   Çözüm: Bu kullanıcıları user_site_memberships tablosuna ekleyin:")
    for apt in non_member_apartments:
        print(f"\n   INSERT INTO user_site_memberships (user_id, site_id, role_type, user_type, status)")
        print(f"   VALUES ('{apt['current_resident_id']}', '{site_id}', 'sakin', 'kat_maliki', 'aktif');")

if not non_member_messages and not non_member_apartments:
    print("\n✅ Tüm mesajlaşan kullanıcılar ve daire sakinleri site üyesi!")
    print("   Sistem doğru çalışıyor.")

print("\n" + "=" * 80)

cursor.close()
conn.close()
