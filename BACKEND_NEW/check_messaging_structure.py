#!/usr/bin/env python3
"""
Mesajlaşma yapısını kontrol eden script
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
print("MESAJLAŞMA YAPISI ANALİZİ")
print("=" * 80)

# Messages tablosu yapısı
print("\n📋 MESSAGES TABLOSU YAPISI:")
cursor.execute("DESCRIBE messages")
for row in cursor.fetchall():
    print(f"   {row['Field']}: {row['Type']} {'NULL' if row['Null'] == 'YES' else 'NOT NULL'}")

# Toplam mesaj sayısı
cursor.execute("SELECT COUNT(*) as total FROM messages")
total_messages = cursor.fetchone()['total']
print(f"\n📊 Toplam Mesaj Sayısı: {total_messages}")

# Chat type dağılımı
print("\n📊 CHAT TYPE DAĞILIMI:")
cursor.execute("""
    SELECT 
        chat_type,
        COUNT(*) as count
    FROM messages
    GROUP BY chat_type
    ORDER BY count DESC
""")
for row in cursor.fetchall():
    print(f"   {row['chat_type']}: {row['count']} mesaj")

# Site bazlı mesaj dağılımı
print("\n📊 SİTE BAZLI MESAJ DAĞILIMI:")
cursor.execute("""
    SELECT 
        m.site_id,
        s.name as site_name,
        COUNT(*) as message_count,
        COUNT(DISTINCT m.sender_id) as unique_senders
    FROM messages m
    LEFT JOIN sites s ON m.site_id = s.id
    GROUP BY m.site_id, s.name
    ORDER BY message_count DESC
""")
for row in cursor.fetchall():
    print(f"\n   🏢 {row['site_name'] or 'Unknown'} (ID: {row['site_id']})")
    print(f"      Mesaj Sayısı: {row['message_count']}")
    print(f"      Mesaj Gönderen: {row['unique_senders']} kullanıcı")

# Apartment bazlı mesajlar
print("\n📊 DAİRE BAZLI MESAJLAR:")
cursor.execute("""
    SELECT 
        COUNT(*) as count
    FROM messages
    WHERE apartment_id IS NOT NULL
""")
apartment_messages = cursor.fetchone()['count']
print(f"   Daire ID'si olan mesaj: {apartment_messages}")

cursor.execute("""
    SELECT 
        m.apartment_id,
        a.unit_number,
        COUNT(*) as message_count
    FROM messages m
    LEFT JOIN apartments a ON m.apartment_id = a.id
    WHERE m.apartment_id IS NOT NULL
    GROUP BY m.apartment_id, a.unit_number
    ORDER BY message_count DESC
    LIMIT 10
""")
print("\n   En çok mesajlaşılan 10 daire:")
for row in cursor.fetchall():
    print(f"      Daire {row['unit_number'] or 'Unknown'}: {row['message_count']} mesaj")

# Mesajlaşan kullanıcıların site üyelikleri
print("\n📊 MESAJLAŞAN KULLANICILARIN SİTE ÜYELİKLERİ:")
cursor.execute("""
    SELECT 
        m.site_id,
        s.name as site_name,
        COUNT(DISTINCT m.sender_id) as sender_count,
        COUNT(DISTINCT usm.user_id) as member_count
    FROM messages m
    LEFT JOIN sites s ON m.site_id = s.id
    LEFT JOIN user_site_memberships usm ON m.site_id = usm.site_id 
        AND m.sender_id = usm.user_id
        AND usm.is_deleted = FALSE
        AND usm.status = 'aktif'
    GROUP BY m.site_id, s.name
    ORDER BY sender_count DESC
""")
print("\n   Site bazında mesaj gönderen vs site üyesi karşılaştırması:")
for row in cursor.fetchall():
    print(f"\n   🏢 {row['site_name'] or 'Unknown'}")
    print(f"      Mesaj gönderen: {row['sender_count']} kullanıcı")
    print(f"      Site üyesi olan: {row['member_count']} kullanıcı")
    if row['sender_count'] != row['member_count']:
        print(f"      ⚠️  UYUMSUZLUK: {row['sender_count'] - row['member_count']} kullanıcı site üyesi değil!")

# Mesaj gönderen ama site üyesi olmayan kullanıcılar
print("\n⚠️  MESAJ GÖNDEREN AMA SİTE ÜYESİ OLMAYAN KULLANICILAR:")
cursor.execute("""
    SELECT DISTINCT
        m.sender_id,
        u.full_name,
        u.email,
        m.site_id,
        s.name as site_name,
        COUNT(*) as message_count
    FROM messages m
    LEFT JOIN users u ON m.sender_id = u.id
    LEFT JOIN sites s ON m.site_id = s.id
    LEFT JOIN user_site_memberships usm ON m.sender_id = usm.user_id 
        AND m.site_id = usm.site_id
        AND usm.is_deleted = FALSE
        AND usm.status = 'aktif'
    WHERE usm.id IS NULL
    GROUP BY m.sender_id, u.full_name, u.email, m.site_id, s.name
    ORDER BY message_count DESC
""")

non_member_senders = cursor.fetchall()
if non_member_senders:
    print(f"\n   Toplam {len(non_member_senders)} kullanıcı bulundu:")
    for row in non_member_senders:
        print(f"\n   👤 {row['full_name']} ({row['email']})")
        print(f"      Site: {row['site_name']}")
        print(f"      Gönderilen mesaj: {row['message_count']}")
else:
    print("\n   ✅ Tüm mesaj gönderenler site üyesi")

print("\n" + "=" * 80)

cursor.close()
conn.close()
