#!/usr/bin/env python3
"""
Basit mesajlaşma kontrolü
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
print("MESAJLAŞMA KONTROLÜ")
print("=" * 80)

# Toplam mesaj sayısı
cursor.execute("SELECT COUNT(*) as total FROM messages")
total = cursor.fetchone()['total']
print(f"\n📊 Toplam Mesaj: {total}")

# Chat type dağılımı
cursor.execute("""
    SELECT chat_type, COUNT(*) as count
    FROM messages
    GROUP BY chat_type
""")
print("\n📊 Chat Type Dağılımı:")
for row in cursor.fetchall():
    print(f"   {row['chat_type']}: {row['count']}")

# Apartment mesajları
cursor.execute("""
    SELECT COUNT(*) as count
    FROM messages
    WHERE apartment_id IS NOT NULL
""")
apt_count = cursor.fetchone()['count']
print(f"\n📊 Daire ID'li Mesaj: {apt_count}")

# Mesaj gönderen kullanıcılar
cursor.execute("""
    SELECT 
        sender_id,
        COUNT(*) as message_count
    FROM messages
    GROUP BY sender_id
    ORDER BY message_count DESC
    LIMIT 10
""")
print("\n📊 En Çok Mesaj Gönderen 10 Kullanıcı:")
for row in cursor.fetchall():
    # Kullanıcı bilgisini al
    cursor.execute("SELECT full_name, email FROM users WHERE id = %s", (row['sender_id'],))
    user = cursor.fetchone()
    if user:
        print(f"   {user['full_name']} ({user['email']}): {row['message_count']} mesaj")

# Site ID'leri
cursor.execute("""
    SELECT DISTINCT site_id
    FROM messages
""")
print("\n📊 Mesajlaşılan Site ID'leri:")
for row in cursor.fetchall():
    print(f"   Site ID: {row['site_id']}")

print("\n" + "=" * 80)

cursor.close()
conn.close()
