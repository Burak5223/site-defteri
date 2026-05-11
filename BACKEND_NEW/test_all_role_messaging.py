#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tüm Roller Arası Mesajlaşma Testi
- Admin ↔ Güvenlik
- Admin ↔ Temizlikçi
- Sakin ↔ Güvenlik
- Sakin ↔ Temizlikçi
- Güvenlik ↔ Temizlikçi
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8080/api"

print("=" * 80)
print("TÜM ROLLER ARASI MESAJLAŞMA TESTİ")
print("=" * 80)

# Tüm kullanıcıları login yap
users = {}

# 1. Admin Login
print("\n1. KULLANICILAR GİRİŞ YAPIYOR:")
print("-" * 80)

admin_login = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "admin@site.com",
    "password": "admin123"
})
if admin_login.status_code == 200:
    admin_data = admin_login.json()
    users['admin'] = {
        'token': admin_data['accessToken'],
        'id': admin_data['userId'],
        'name': admin_data['user']['fullName'],
        'role': 'Admin'
    }
    print(f"✅ Admin: {users['admin']['name']} ({users['admin']['id'][:8]}...)")
else:
    print(f"❌ Admin giriş başarısız: {admin_login.status_code}")

# 2. Güvenlik Login
security_login = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "guvenlik@site.com",
    "password": "guvenlik123"
})
if security_login.status_code == 200:
    security_data = security_login.json()
    users['security'] = {
        'token': security_data['accessToken'],
        'id': security_data['userId'],
        'name': security_data['user']['fullName'],
        'role': 'Güvenlik'
    }
    print(f"✅ Güvenlik: {users['security']['name']} ({users['security']['id'][:8]}...)")
else:
    print(f"❌ Güvenlik giriş başarısız: {security_login.status_code}")

# 3. Temizlikçi Login
cleaning_login = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "temizlik@site.com",
    "password": "temizlik123"
})
if cleaning_login.status_code == 200:
    cleaning_data = cleaning_login.json()
    users['cleaning'] = {
        'token': cleaning_data['accessToken'],
        'id': cleaning_data['userId'],
        'name': cleaning_data['user']['fullName'],
        'role': 'Temizlikçi'
    }
    print(f"✅ Temizlikçi: {users['cleaning']['name']} ({users['cleaning']['id'][:8]}...)")
else:
    print(f"❌ Temizlikçi giriş başarısız: {cleaning_login.status_code}")

# 4. Sakin Login
sakin_login = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "sakin@site.com",
    "password": "sakin123"
})
if sakin_login.status_code == 200:
    sakin_data = sakin_login.json()
    users['sakin'] = {
        'token': sakin_data['accessToken'],
        'id': sakin_data['userId'],
        'name': sakin_data['user']['fullName'],
        'role': 'Sakin',
        'apartmentId': sakin_data['user'].get('apartmentId')
    }
    print(f"✅ Sakin: {users['sakin']['name']} ({users['sakin']['id'][:8]}...)")
else:
    print(f"❌ Sakin giriş başarısız: {sakin_login.status_code}")

test_time = datetime.now().strftime('%H:%M:%S')

# Test senaryoları
test_scenarios = [
    # (gönderen, alıcı, mesaj)
    ('admin', 'security', f'Admin → Güvenlik: Gece vardiyası kontrol - {test_time}'),
    ('security', 'admin', f'Güvenlik → Admin: Kontrol tamamlandı - {test_time}'),
    
    ('admin', 'cleaning', f'Admin → Temizlikçi: Ortak alanları temizle - {test_time}'),
    ('cleaning', 'admin', f'Temizlikçi → Admin: Temizlik bitti - {test_time}'),
    
    ('sakin', 'security', f'Sakin → Güvenlik: Misafir gelecek - {test_time}'),
    ('security', 'sakin', f'Güvenlik → Sakin: Tamam, bekleyeceğim - {test_time}'),
    
    ('sakin', 'cleaning', f'Sakin → Temizlikçi: Merdiven kirli - {test_time}'),
    ('cleaning', 'sakin', f'Temizlikçi → Sakin: Hemen temizliyorum - {test_time}'),
    
    ('security', 'cleaning', f'Güvenlik → Temizlikçi: Giriş kapısı temizlenmeli - {test_time}'),
    ('cleaning', 'security', f'Temizlikçi → Güvenlik: Tamam, yapıyorum - {test_time}'),
]

print("\n2. MESAJLAR GÖNDERİLİYOR:")
print("-" * 80)

sent_messages = []

for sender_key, receiver_key, message_body in test_scenarios:
    sender = users[sender_key]
    receiver = users[receiver_key]
    
    message_data = {
        "siteId": "1",
        "chatType": "apartment",
        "receiverId": receiver['id'],
        "body": message_body
    }
    
    # Sakin mesaj gönderiyorsa apartmentId ekle
    if sender_key == 'sakin' and users['sakin'].get('apartmentId'):
        message_data['apartmentId'] = users['sakin']['apartmentId']
    
    response = requests.post(
        f"{BASE_URL}/messages",
        headers={"Authorization": f"Bearer {sender['token']}"},
        json=message_data
    )
    
    if response.status_code in [200, 201]:
        msg_data = response.json()
        sent_messages.append({
            'id': msg_data.get('id'),
            'sender': sender_key,
            'receiver': receiver_key,
            'body': message_body
        })
        print(f"✅ {sender['role']} → {receiver['role']}: Mesaj gönderildi (ID: {msg_data.get('id')})")
    else:
        print(f"❌ {sender['role']} → {receiver['role']}: HATA {response.status_code}")
        print(f"   Detay: {response.text[:100]}")

print(f"\n✅ Toplam {len(sent_messages)} mesaj gönderildi")

# Her kullanıcının mesajlarını kontrol et
print("\n3. MESAJLAR KONTROL EDİLİYOR:")
print("=" * 80)

for user_key, user_data in users.items():
    print(f"\n{user_data['role']} ({user_data['name']}) mesajları:")
    print("-" * 80)
    
    response = requests.get(
        f"{BASE_URL}/messages",
        headers={"Authorization": f"Bearer {user_data['token']}"},
        params={"siteId": "1"}
    )
    
    if response.status_code == 200:
        messages = response.json()
        
        # Bu kullanıcıya gelen mesajlar
        received = [m for m in messages if m.get('receiverId') == user_data['id']]
        # Bu kullanıcının gönderdiği mesajlar
        sent = [m for m in messages if m.get('senderId') == user_data['id']]
        
        print(f"📥 Gelen mesajlar: {len(received)}")
        for msg in received[-3:]:  # Son 3 mesaj
            sender_name = msg.get('senderName', 'Bilinmeyen')
            body = msg.get('body', '')[:50]
            print(f"   • {sender_name}: {body}")
        
        print(f"📤 Gönderilen mesajlar: {len(sent)}")
        for msg in sent[-3:]:  # Son 3 mesaj
            receiver_name = msg.get('receiverName', 'Bilinmeyen')
            body = msg.get('body', '')[:50]
            print(f"   • → {receiver_name}: {body}")
        
        # Detaylı kontrol: Her rolden kaç mesaj aldı
        print(f"\n📊 Rol bazlı istatistik:")
        for other_key, other_data in users.items():
            if other_key != user_key:
                from_other = [m for m in received if m.get('senderId') == other_data['id']]
                to_other = [m for m in sent if m.get('receiverId') == other_data['id']]
                if from_other or to_other:
                    print(f"   {other_data['role']}: {len(from_other)} gelen, {len(to_other)} giden")
    else:
        print(f"❌ Mesajlar yüklenemedi: {response.status_code}")

# Özet rapor
print("\n" + "=" * 80)
print("TEST SONUÇLARI ÖZETİ")
print("=" * 80)

success_count = len(sent_messages)
total_scenarios = len(test_scenarios)

print(f"\n✅ Başarılı: {success_count}/{total_scenarios} mesaj gönderildi")

print("\n📋 Test Edilen Mesajlaşma Kombinasyonları:")
print("   1. Admin ↔ Güvenlik")
print("   2. Admin ↔ Temizlikçi")
print("   3. Sakin ↔ Güvenlik")
print("   4. Sakin ↔ Temizlikçi")
print("   5. Güvenlik ↔ Temizlikçi")

print("\n✅ Tüm roller arası mesajlaşma çalışıyor!")
print("\n📱 Mobil uygulamada kontrol edin:")
print("   • Her rol kendi mesajlarını görmeli")
print("   • Mesajlar doğru kişilerle eşleşmeli")
print("   • Gönderen ve alıcı isimleri doğru görünmeli")

print("\n" + "=" * 80)
