#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Debug: Mesaj API'sinin ne döndürdüğünü kontrol et
"""

import requests
import json

BASE_URL = "http://localhost:8080/api"

# Admin login
admin_login = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "admin@site.com",
    "password": "admin123"
})
admin_data = admin_login.json()
admin_token = admin_data['accessToken']
admin_id = admin_data['userId']

print("=" * 80)
print("MESAJ API DEBUG")
print("=" * 80)
print(f"Admin ID: {admin_id}")

# Mesajları çek
response = requests.get(
    f"{BASE_URL}/messages",
    headers={"Authorization": f"Bearer {admin_token}"},
    params={"siteId": "1"}
)

print(f"\nAPI Response Status: {response.status_code}")

if response.status_code == 200:
    messages = response.json()
    print(f"Toplam mesaj sayısı: {len(messages)}")
    
    print("\n" + "=" * 80)
    print("TÜM MESAJLAR:")
    print("=" * 80)
    
    for i, msg in enumerate(messages, 1):
        print(f"\n{i}. Mesaj:")
        print(f"   ID: {msg.get('id')}")
        print(f"   Sender ID: {msg.get('senderId')}")
        print(f"   Sender Name: {msg.get('senderName')}")
        print(f"   Receiver ID: {msg.get('receiverId')}")
        print(f"   Receiver Name: {msg.get('receiverName')}")
        print(f"   Chat Type: {msg.get('chatType')}")
        print(f"   Apartment ID: {msg.get('apartmentId')}")
        print(f"   Body: {msg.get('body')[:50]}...")
        print(f"   Created: {msg.get('createdAt')}")
    
    # Grup mesajları
    group_msgs = [m for m in messages if m.get('chatType') == 'group']
    print(f"\n📊 Grup mesajları: {len(group_msgs)}")
    
    # Apartment mesajları
    apartment_msgs = [m for m in messages if m.get('chatType') == 'apartment']
    print(f"📊 Apartment mesajları: {len(apartment_msgs)}")
    
    # Direct mesajları
    direct_msgs = [m for m in messages if m.get('chatType') == 'direct']
    print(f"📊 Direct mesajları: {len(direct_msgs)}")
    
    # Diğer
    other_msgs = [m for m in messages if m.get('chatType') not in ['group', 'apartment', 'direct']]
    print(f"📊 Diğer mesajlar: {len(other_msgs)}")
    if other_msgs:
        print("   Chat types:", set(m.get('chatType') for m in other_msgs))

else:
    print(f"❌ Hata: {response.text}")

# Şimdi de direkt veritabanından kontrol edelim
print("\n" + "=" * 80)
print("VERİTABANI KONTROLÜ")
print("=" * 80)

import mysql.connector

try:
    conn = mysql.connector.connect(
        host='localhost',
        user='root',
        password='root',
        database='site_yonetim'
    )
    cursor = conn.cursor(dictionary=True)
    
    # Son 10 mesajı çek
    cursor.execute("""
        SELECT id, sender_id, receiver_id, chat_type, apartment_id, 
               LEFT(body, 50) as body_preview, created_at
        FROM messages 
        WHERE site_id = '1'
        ORDER BY created_at DESC 
        LIMIT 10
    """)
    
    db_messages = cursor.fetchall()
    print(f"\nVeritabanında son 10 mesaj:")
    for msg in db_messages:
        print(f"\n  ID: {msg['id']}")
        print(f"  Sender: {msg['sender_id']}")
        print(f"  Receiver: {msg['receiver_id']}")
        print(f"  Chat Type: {msg['chat_type']}")
        print(f"  Apartment: {msg['apartment_id']}")
        print(f"  Body: {msg['body_preview']}")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"❌ Veritabanı hatası: {e}")

print("\n" + "=" * 80)
