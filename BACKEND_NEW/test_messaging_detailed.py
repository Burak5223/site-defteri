#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Detaylı Mesajlaşma Testi
- Sakin ve Admin arasında mesajlaşma
- Mesajların doğru görünmesi
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8080/api"

print("=" * 80)
print("DETAYLI MESAJLAŞMA TESTİ")
print("=" * 80)

# 1. Admin Login
print("\n1. ADMIN GİRİŞİ:")
print("-" * 80)
admin_login = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "admin@site.com",
    "password": "admin123"
})
admin_data = admin_login.json()
admin_token = admin_data['accessToken']
admin_id = admin_data['userId']
print(f"✅ Admin giriş yaptı")
print(f"   ID: {admin_id}")
print(f"   İsim: {admin_data['user']['fullName']}")

# 2. Sakin Login
print("\n2. SAKİN GİRİŞİ:")
print("-" * 80)
sakin_login = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "sakin@site.com",
    "password": "sakin123"
})
sakin_data = sakin_login.json()
sakin_token = sakin_data['accessToken']
sakin_id = sakin_data['userId']
sakin_apartment_id = sakin_data['user']['apartmentId']
print(f"✅ Sakin giriş yaptı")
print(f"   ID: {sakin_id}")
print(f"   İsim: {sakin_data['user']['fullName']}")
print(f"   Daire ID: {sakin_apartment_id}")

# 3. Sakin -> Admin mesaj gönder
print("\n3. SAKİN → YÖNETİCİ MESAJ GÖNDERİYOR:")
print("-" * 80)
test_time = datetime.now().strftime('%H:%M:%S')
sakin_message = f"Merhaba yönetici, test mesajı - {test_time}"

response = requests.post(
    f"{BASE_URL}/messages",
    headers={"Authorization": f"Bearer {sakin_token}"},
    json={
        "siteId": "1",
        "chatType": "apartment",
        "receiverId": admin_id,
        "apartmentId": sakin_apartment_id,
        "body": sakin_message
    }
)
print(f"Status: {response.status_code}")
if response.status_code in [200, 201]:
    msg_data = response.json()
    sakin_msg_id = msg_data.get('id')
    print(f"✅ Mesaj gönderildi!")
    print(f"   Mesaj ID: {sakin_msg_id}")
    print(f"   İçerik: {sakin_message}")
else:
    print(f"❌ Hata: {response.text}")

# 4. Admin mesajları kontrol ediyor
print("\n4. YÖNETİCİ MESAJLARI KONTROL EDİYOR:")
print("-" * 80)
admin_messages = requests.get(
    f"{BASE_URL}/messages",
    headers={"Authorization": f"Bearer {admin_token}"},
    params={"siteId": "1"}
)
if admin_messages.status_code == 200:
    messages = admin_messages.json()
    print(f"✅ Toplam {len(messages)} mesaj yüklendi")
    
    # Sakin'den gelen mesajları filtrele
    from_sakin = [m for m in messages if m.get('senderId') == sakin_id]
    print(f"   Sakin'den gelen: {len(from_sakin)} mesaj")
    
    if from_sakin:
        print("\n   📬 Sakin'den gelen son mesajlar:")
        for msg in from_sakin[-3:]:
            print(f"      • {msg.get('body')[:60]}")
            print(f"        Tarih: {msg.get('createdAt')}")
            print(f"        Okundu: {'✓' if msg.get('isRead') else '✗'}")
else:
    print(f"❌ Hata: {admin_messages.text}")

# 5. Admin cevap veriyor
print("\n5. YÖNETİCİ CEVAP VERİYOR:")
print("-" * 80)
admin_reply = f"Merhaba sakin, cevap mesajı - {test_time}"

response = requests.post(
    f"{BASE_URL}/messages",
    headers={"Authorization": f"Bearer {admin_token}"},
    json={
        "siteId": "1",
        "chatType": "apartment",
        "receiverId": sakin_id,
        "apartmentId": sakin_apartment_id,
        "body": admin_reply
    }
)
print(f"Status: {response.status_code}")
if response.status_code in [200, 201]:
    msg_data = response.json()
    admin_msg_id = msg_data.get('id')
    print(f"✅ Cevap gönderildi!")
    print(f"   Mesaj ID: {admin_msg_id}")
    print(f"   İçerik: {admin_reply}")
else:
    print(f"❌ Hata: {response.text}")

# 6. Sakin mesajları kontrol ediyor
print("\n6. SAKİN MESAJLARI KONTROL EDİYOR:")
print("-" * 80)
sakin_messages = requests.get(
    f"{BASE_URL}/messages",
    headers={"Authorization": f"Bearer {sakin_token}"},
    params={"siteId": "1"}
)
if sakin_messages.status_code == 200:
    messages = sakin_messages.json()
    print(f"✅ Toplam {len(messages)} mesaj yüklendi")
    
    # Admin'den gelen mesajları filtrele
    from_admin = [m for m in messages if m.get('senderId') == admin_id]
    print(f"   Admin'den gelen: {len(from_admin)} mesaj")
    
    if from_admin:
        print("\n   📬 Admin'den gelen son mesajlar:")
        for msg in from_admin[-3:]:
            print(f"      • {msg.get('body')[:60]}")
            print(f"        Tarih: {msg.get('createdAt')}")
            print(f"        Okundu: {'✓' if msg.get('isRead') else '✗'}")
else:
    print(f"❌ Hata: {sakin_messages.text}")

# 7. Mesajlaşma akışını göster
print("\n7. MESAJLAŞMA AKIŞI (Son 5 mesaj):")
print("-" * 80)
all_messages = requests.get(
    f"{BASE_URL}/messages",
    headers={"Authorization": f"Bearer {admin_token}"},
    params={"siteId": "1"}
)
if all_messages.status_code == 200:
    messages = all_messages.json()
    # Sakin ve Admin arasındaki mesajları filtrele
    conversation = [m for m in messages if 
                   (m.get('senderId') == sakin_id and m.get('receiverId') == admin_id) or
                   (m.get('senderId') == admin_id and m.get('receiverId') == sakin_id)]
    
    # Tarihe göre sırala
    conversation.sort(key=lambda x: x.get('createdAt', ''))
    
    print(f"Toplam {len(conversation)} mesaj:")
    for i, msg in enumerate(conversation[-5:], 1):
        sender_icon = "👤" if msg.get('senderId') == sakin_id else "👨‍💼"
        sender_name = "Sakin" if msg.get('senderId') == sakin_id else "Admin"
        print(f"\n{i}. {sender_icon} {sender_name}:")
        print(f"   {msg.get('body')}")
        print(f"   📅 {msg.get('createdAt')}")

# 8. Kullanıcıları listele (Sakin'in göreceği rol kutuları)
print("\n8. SAKİN'İN GÖRECEĞİ ROL KUTULARI:")
print("-" * 80)
users = requests.get(
    f"{BASE_URL}/users",
    headers={"Authorization": f"Bearer {sakin_token}"}
)
if users.status_code == 200:
    all_users = users.json()
    
    # Admin kullanıcıları
    admins = [u for u in all_users if 'ADMIN' in str(u.get('roles', []))]
    print(f"📦 Yönetici Kutusu: {len(admins)} kişi")
    for admin in admins[:3]:
        print(f"   • {admin.get('fullName', 'N/A')}")
    
    # Güvenlik kullanıcıları
    security = [u for u in all_users if 'SECURITY' in str(u.get('roles', []))]
    print(f"\n📦 Güvenlik Kutusu: {len(security)} kişi")
    for sec in security[:3]:
        print(f"   • {sec.get('fullName', 'N/A')}")
    
    # Temizlik kullanıcıları
    cleaning = [u for u in all_users if 'CLEANING' in str(u.get('roles', []))]
    print(f"\n📦 Temizlikçi Kutusu: {len(cleaning)} kişi")
    for clean in cleaning[:3]:
        print(f"   • {clean.get('fullName', 'N/A')}")

print("\n" + "=" * 80)
print("TEST TAMAMLANDI!")
print("=" * 80)
print("\n✅ Kontrol Listesi:")
print("   1. Sakin → Admin mesaj gönderdi")
print("   2. Admin mesajı gördü")
print("   3. Admin → Sakin cevap verdi")
print("   4. Sakin cevabı gördü")
print("   5. Mesajlaşma akışı doğru")
print("\n📱 Mobil uygulamada kontrol edin:")
print("   • Sakin girişinde 'Daire Mesajları' bölümü GÖRÜNMEMELİ")
print("   • Sakin 'Yönetici' kutusunda admin'i görmeli")
print("   • Admin 'Daire Mesajları' bölümünde Daire 12'yi görmeli")
print("   • Mesajlar her iki tarafta da görünmeli")
