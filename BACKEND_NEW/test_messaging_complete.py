#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Mesajlaşma Sistemi Tam Test
- Sakin -> Yönetici mesaj gönderme
- Yönetici -> Sakin cevap verme
- Mesajların doğru görünmesi
"""

import mysql.connector
import requests
import json
from datetime import datetime

# Veritabanı bağlantısı
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = db.cursor(dictionary=True)

print("=" * 80)
print("MESAJLAŞMA SİSTEMİ TAM TEST")
print("=" * 80)

# 1. Kullanıcıları kontrol et
print("\n1. KULLANICILAR:")
print("-" * 80)

cursor.execute("""
    SELECT u.user_id, u.email, u.full_name, u.roles, 
           r.apartment_id, a.apartment_number, a.block_name
    FROM users u
    LEFT JOIN residency r ON u.user_id = r.user_id
    LEFT JOIN apartments a ON r.apartment_id = a.apartment_id
    WHERE u.email IN ('sakin@site.com', 'admin@site.com', 'guvenlik@site.com')
    ORDER BY u.email
""")

users = cursor.fetchall()
user_map = {}

for user in users:
    print(f"\n📧 Email: {user['email']}")
    print(f"   👤 İsim: {user['full_name']}")
    print(f"   🎭 Rol: {user['roles']}")
    print(f"   🏠 Daire: {user['apartment_number']} ({user['block_name']})" if user['apartment_id'] else "   🏠 Daire: Yok")
    user_map[user['email']] = user

# 2. Mevcut mesajları kontrol et
print("\n\n2. MEVCUT MESAJLAR:")
print("-" * 80)

cursor.execute("""
    SELECT m.message_id, m.sender_id, m.receiver_id, m.body, m.chat_type,
           m.apartment_id, m.created_at, m.is_read,
           sender.email as sender_email, sender.full_name as sender_name,
           receiver.email as receiver_email, receiver.full_name as receiver_name,
           a.apartment_number, a.block_name
    FROM messages m
    JOIN users sender ON m.sender_id = sender.user_id
    LEFT JOIN users receiver ON m.receiver_id = receiver.user_id
    LEFT JOIN apartments a ON m.apartment_id = a.apartment_id
    WHERE sender.email IN ('sakin@site.com', 'admin@site.com', 'guvenlik@site.com')
       OR receiver.email IN ('sakin@site.com', 'admin@site.com', 'guvenlik@site.com')
    ORDER BY m.created_at DESC
    LIMIT 10
""")

messages = cursor.fetchall()
if messages:
    for msg in messages:
        print(f"\n📨 Mesaj ID: {msg['message_id']}")
        print(f"   Gönderen: {msg['sender_name']} ({msg['sender_email']})")
        print(f"   Alıcı: {msg['receiver_name']} ({msg['receiver_email']})" if msg['receiver_email'] else "   Alıcı: Grup")
        print(f"   Tip: {msg['chat_type']}")
        print(f"   Daire: {msg['apartment_number']} ({msg['block_name']})" if msg['apartment_id'] else "   Daire: -")
        print(f"   Mesaj: {msg['body'][:50]}...")
        print(f"   Okundu: {'✓' if msg['is_read'] else '✗'}")
        print(f"   Tarih: {msg['created_at']}")
else:
    print("❌ Hiç mesaj yok!")

# 3. Test mesajı gönder: Sakin -> Yönetici
print("\n\n3. TEST MESAJI GÖNDER: Sakin -> Yönetici")
print("-" * 80)

if 'sakin@site.com' in user_map and 'admin@site.com' in user_map:
    sakin = user_map['sakin@site.com']
    admin = user_map['admin@site.com']
    
    test_message = f"Test mesajı - Sakin'den Yönetici'ye - {datetime.now().strftime('%H:%M:%S')}"
    
    cursor.execute("""
        INSERT INTO messages (sender_id, receiver_id, body, chat_type, apartment_id, site_id, created_at)
        VALUES (%s, %s, %s, 'apartment', %s, 1, NOW())
    """, (sakin['user_id'], admin['user_id'], test_message, sakin['apartment_id']))
    
    db.commit()
    message_id = cursor.lastrowid
    
    print(f"✅ Mesaj gönderildi!")
    print(f"   Mesaj ID: {message_id}")
    print(f"   Gönderen: {sakin['full_name']} (Daire {sakin['apartment_number']})")
    print(f"   Alıcı: {admin['full_name']}")
    print(f"   Mesaj: {test_message}")
    
    # 4. Yönetici cevap versin
    print("\n\n4. YÖNETICI CEVAP VERİYOR:")
    print("-" * 80)
    
    reply_message = f"Cevap - Yönetici'den Sakin'e - {datetime.now().strftime('%H:%M:%S')}"
    
    cursor.execute("""
        INSERT INTO messages (sender_id, receiver_id, body, chat_type, apartment_id, site_id, created_at)
        VALUES (%s, %s, %s, 'apartment', %s, 1, NOW())
    """, (admin['user_id'], sakin['user_id'], reply_message, sakin['apartment_id']))
    
    db.commit()
    reply_id = cursor.lastrowid
    
    print(f"✅ Cevap gönderildi!")
    print(f"   Mesaj ID: {reply_id}")
    print(f"   Gönderen: {admin['full_name']}")
    print(f"   Alıcı: {sakin['full_name']} (Daire {sakin['apartment_number']})")
    print(f"   Mesaj: {reply_message}")
    
else:
    print("❌ Sakin veya Admin kullanıcısı bulunamadı!")

# 5. Mesajlaşma akışını göster
print("\n\n5. MESAJLAŞMA AKIŞI (Son 5 mesaj):")
print("-" * 80)

cursor.execute("""
    SELECT m.message_id, m.sender_id, m.receiver_id, m.body, m.chat_type,
           m.apartment_id, m.created_at, m.is_read,
           sender.email as sender_email, sender.full_name as sender_name,
           receiver.email as receiver_email, receiver.full_name as receiver_name,
           a.apartment_number, a.block_name
    FROM messages m
    JOIN users sender ON m.sender_id = sender.user_id
    LEFT JOIN users receiver ON m.receiver_id = receiver.user_id
    LEFT JOIN apartments a ON m.apartment_id = a.apartment_id
    WHERE m.chat_type = 'apartment'
      AND (sender.email IN ('sakin@site.com', 'admin@site.com') 
           OR receiver.email IN ('sakin@site.com', 'admin@site.com'))
    ORDER BY m.created_at DESC
    LIMIT 5
""")

conversation = cursor.fetchall()
if conversation:
    for i, msg in enumerate(reversed(conversation), 1):
        sender_icon = "👤" if msg['sender_email'] == 'sakin@site.com' else "👨‍💼"
        print(f"\n{i}. {sender_icon} {msg['sender_name']}:")
        print(f"   → {msg['body']}")
        print(f"   📅 {msg['created_at']}")
        print(f"   {'✓ Okundu' if msg['is_read'] else '✗ Okunmadı'}")
else:
    print("❌ Mesajlaşma bulunamadı!")

# 6. Yöneticinin göreceği mesajlar
print("\n\n6. YÖNETİCİNİN GÖRECEĞİ MESAJLAR:")
print("-" * 80)

if 'admin@site.com' in user_map:
    admin = user_map['admin@site.com']
    
    cursor.execute("""
        SELECT m.message_id, m.sender_id, m.receiver_id, m.body, m.chat_type,
               m.apartment_id, m.created_at, m.is_read,
               sender.full_name as sender_name,
               a.apartment_number, a.block_name
        FROM messages m
        JOIN users sender ON m.sender_id = sender.user_id
        LEFT JOIN apartments a ON m.apartment_id = a.apartment_id
        WHERE m.receiver_id = %s
          AND m.chat_type = 'apartment'
        ORDER BY m.created_at DESC
        LIMIT 5
    """, (admin['user_id'],))
    
    admin_messages = cursor.fetchall()
    if admin_messages:
        print(f"📬 Yönetici'nin gelen kutusu ({len(admin_messages)} mesaj):")
        for msg in admin_messages:
            print(f"\n   📨 {msg['sender_name']} (Daire {msg['apartment_number']})")
            print(f"      {msg['body']}")
            print(f"      {'✓ Okundu' if msg['is_read'] else '✗ Okunmadı'}")
    else:
        print("📭 Yönetici'nin gelen kutusu boş!")

# 7. Sakinin göreceği mesajlar
print("\n\n7. SAKİNİN GÖRECEĞİ MESAJLAR:")
print("-" * 80)

if 'sakin@site.com' in user_map:
    sakin = user_map['sakin@site.com']
    
    cursor.execute("""
        SELECT m.message_id, m.sender_id, m.receiver_id, m.body, m.chat_type,
               m.apartment_id, m.created_at, m.is_read,
               sender.full_name as sender_name, sender.roles
        FROM messages m
        JOIN users sender ON m.sender_id = sender.user_id
        WHERE m.receiver_id = %s
          AND m.chat_type = 'apartment'
        ORDER BY m.created_at DESC
        LIMIT 5
    """, (sakin['user_id'],))
    
    sakin_messages = cursor.fetchall()
    if sakin_messages:
        print(f"📬 Sakin'in gelen kutusu ({len(sakin_messages)} mesaj):")
        for msg in sakin_messages:
            print(f"\n   📨 {msg['sender_name']} ({msg['roles']})")
            print(f"      {msg['body']}")
            print(f"      {'✓ Okundu' if msg['is_read'] else '✗ Okunmadı'}")
    else:
        print("📭 Sakin'in gelen kutusu boş!")

print("\n" + "=" * 80)
print("TEST TAMAMLANDI!")
print("=" * 80)

cursor.close()
db.close()
