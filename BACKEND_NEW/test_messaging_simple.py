#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Basit Mesajlaşma Testi
"""

import mysql.connector
from datetime import datetime

db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = db.cursor(dictionary=True)

print("=" * 80)
print("MESAJLAŞMA TESTİ")
print("=" * 80)

# 1. Kullanıcıları listele
print("\n1. KULLANICILAR:")
print("-" * 80)

cursor.execute("""
    SELECT user_id, email, full_name, roles, apartment_id
    FROM users
    WHERE email IN ('sakin@site.com', 'admin@site.com', 'guvenlik@site.com')
    ORDER BY email
""")

users = cursor.fetchall()
user_map = {}

for user in users:
    print(f"\n📧 {user['email']}")
    print(f"   ID: {user['user_id']}")
    print(f"   İsim: {user['full_name']}")
    print(f"   Rol: {user['roles']}")
    print(f"   Daire ID: {user['apartment_id']}")
    user_map[user['email']] = user

# 2. Mevcut mesajları göster
print("\n\n2. MEVCUT MESAJLAR:")
print("-" * 80)

cursor.execute("""
    SELECT m.message_id, m.sender_id, m.receiver_id, m.body, m.chat_type,
           m.apartment_id, m.created_at, m.is_read,
           sender.email as sender_email, sender.full_name as sender_name,
           receiver.email as receiver_email, receiver.full_name as receiver_name
    FROM messages m
    JOIN users sender ON m.sender_id = sender.user_id
    LEFT JOIN users receiver ON m.receiver_id = receiver.user_id
    WHERE sender.email IN ('sakin@site.com', 'admin@site.com', 'guvenlik@site.com')
       OR receiver.email IN ('sakin@site.com', 'admin@site.com', 'guvenlik@site.com')
    ORDER BY m.created_at DESC
    LIMIT 10
""")

messages = cursor.fetchall()
if messages:
    for msg in messages:
        print(f"\n📨 ID: {msg['message_id']}")
        print(f"   {msg['sender_name']} → {msg['receiver_name'] or 'Grup'}")
        print(f"   Tip: {msg['chat_type']}")
        print(f"   Mesaj: {msg['body'][:60]}...")
        print(f"   {'✓ Okundu' if msg['is_read'] else '✗ Okunmadı'}")
else:
    print("❌ Hiç mesaj yok!")

# 3. Test mesajı gönder
print("\n\n3. TEST MESAJI GÖNDER:")
print("-" * 80)

if 'sakin@site.com' in user_map and 'admin@site.com' in user_map:
    sakin = user_map['sakin@site.com']
    admin = user_map['admin@site.com']
    
    # Sakin -> Admin
    test_msg = f"Test: Sakin'den Yönetici'ye - {datetime.now().strftime('%H:%M:%S')}"
    
    cursor.execute("""
        INSERT INTO messages (sender_id, receiver_id, body, chat_type, apartment_id, site_id, created_at)
        VALUES (%s, %s, %s, 'apartment', %s, 1, NOW())
    """, (sakin['user_id'], admin['user_id'], test_msg, sakin['apartment_id']))
    
    db.commit()
    msg_id = cursor.lastrowid
    
    print(f"✅ Mesaj gönderildi! (ID: {msg_id})")
    print(f"   {sakin['full_name']} → {admin['full_name']}")
    print(f"   {test_msg}")
    
    # Admin -> Sakin (Cevap)
    reply_msg = f"Cevap: Yönetici'den Sakin'e - {datetime.now().strftime('%H:%M:%S')}"
    
    cursor.execute("""
        INSERT INTO messages (sender_id, receiver_id, body, chat_type, apartment_id, site_id, created_at)
        VALUES (%s, %s, %s, 'apartment', %s, 1, NOW())
    """, (admin['user_id'], sakin['user_id'], reply_msg, sakin['apartment_id']))
    
    db.commit()
    reply_id = cursor.lastrowid
    
    print(f"\n✅ Cevap gönderildi! (ID: {reply_id})")
    print(f"   {admin['full_name']} → {sakin['full_name']}")
    print(f"   {reply_msg}")
    
else:
    print("❌ Kullanıcılar bulunamadı!")

# 4. Mesajlaşma akışı
print("\n\n4. MESAJLAŞMA AKIŞI:")
print("-" * 80)

if 'sakin@site.com' in user_map and 'admin@site.com' in user_map:
    sakin = user_map['sakin@site.com']
    admin = user_map['admin@site.com']
    
    cursor.execute("""
        SELECT m.message_id, m.sender_id, m.body, m.created_at,
               sender.full_name as sender_name
        FROM messages m
        JOIN users sender ON m.sender_id = sender.user_id
        WHERE m.chat_type = 'apartment'
          AND ((m.sender_id = %s AND m.receiver_id = %s)
               OR (m.sender_id = %s AND m.receiver_id = %s))
        ORDER BY m.created_at DESC
        LIMIT 5
    """, (sakin['user_id'], admin['user_id'], admin['user_id'], sakin['user_id']))
    
    conversation = cursor.fetchall()
    if conversation:
        for i, msg in enumerate(reversed(conversation), 1):
            icon = "👤" if msg['sender_id'] == sakin['user_id'] else "👨‍💼"
            print(f"\n{i}. {icon} {msg['sender_name']}:")
            print(f"   {msg['body']}")
            print(f"   {msg['created_at']}")
    else:
        print("❌ Mesajlaşma bulunamadı!")

print("\n" + "=" * 80)
print("TEST TAMAMLANDI!")
print("=" * 80)

cursor.close()
db.close()
