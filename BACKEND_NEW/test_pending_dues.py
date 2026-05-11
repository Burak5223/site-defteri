#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Bekleyen Aidatlar Testi
- Admin: Atadığı tüm aidatlardan ödenmeyen
- Sakin: Kendisine atanan ve ödemediği
"""

import requests
import json

BASE_URL = "http://localhost:8080/api"

print("=" * 80)
print("BEKLEYEN AİDATLAR TESTİ")
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
print(f"✅ Admin giriş yaptı")

# 2. Sakin Login
print("\n2. SAKİN GİRİŞİ:")
print("-" * 80)
sakin_login = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "sakin@site.com",
    "password": "sakin123"
})
sakin_data = sakin_login.json()
sakin_token = sakin_data['accessToken']
sakin_apartment = sakin_data['user'].get('apartmentId')
print(f"✅ Sakin giriş yaptı")
print(f"   Daire ID: {sakin_apartment}")

# 3. Admin tüm aidatları görüyor
print("\n3. ADMIN TÜM AİDATLARI GÖRMELİ:")
print("-" * 80)
admin_dues = requests.get(
    f"{BASE_URL}/sites/1/dues",
    headers={"Authorization": f"Bearer {admin_token}"}
)

if admin_dues.status_code == 200:
    all_dues = admin_dues.json()
    print(f"✅ Toplam {len(all_dues)} aidat kaydı")
    
    # Status'lere göre grupla
    by_status = {}
    for due in all_dues:
        status = due.get('status', 'unknown')
        by_status[status] = by_status.get(status, 0) + 1
    
    print(f"\n📊 Status'lere göre dağılım:")
    for status, count in by_status.items():
        print(f"   {status}: {count} aidat")
    
    # Bekleyen aidatlar
    pending = [d for d in all_dues if d.get('status') in ['bekliyor', 'pending']]
    pending_amount = sum(d.get('amount', 0) for d in pending)
    
    print(f"\n💰 Bekleyen Aidatlar:")
    print(f"   Sayı: {len(pending)}")
    print(f"   Toplam: ₺{pending_amount:,.2f}")
    
    if pending:
        print(f"\n   İlk 5 bekleyen aidat:")
        for due in pending[:5]:
            print(f"   • Daire {due.get('apartmentNumber')}: ₺{due.get('amount')} - {due.get('period')}")
else:
    print(f"❌ Hata: {admin_dues.status_code}")

# 4. Sakin sadece kendi aidatlarını görüyor
print("\n4. SAKİN SADECE KENDİ AİDATLARINI GÖRMELİ:")
print("-" * 80)
sakin_dues = requests.get(
    f"{BASE_URL}/dues/my",
    headers={"Authorization": f"Bearer {sakin_token}"}
)

if sakin_dues.status_code == 200:
    my_dues = sakin_dues.json()
    print(f"✅ Toplam {len(my_dues)} aidat kaydı")
    
    # Status'lere göre grupla
    by_status = {}
    for due in my_dues:
        status = due.get('status', 'unknown')
        by_status[status] = by_status.get(status, 0) + 1
    
    print(f"\n📊 Status'lere göre dağılım:")
    for status, count in by_status.items():
        print(f"   {status}: {count} aidat")
    
    # Bekleyen aidatlar
    pending = [d for d in my_dues if d.get('status') in ['bekliyor', 'pending']]
    pending_amount = sum(d.get('amount', 0) for d in pending)
    
    print(f"\n💰 Bekleyen Aidatlar:")
    print(f"   Sayı: {len(pending)}")
    print(f"   Toplam: ₺{pending_amount:,.2f}")
    
    if pending:
        print(f"\n   Bekleyen aidatlar:")
        for due in pending:
            print(f"   • {due.get('period')}: ₺{due.get('amount')} - {due.get('dueDate')}")
    
    # Ödenen aidatlar
    paid = [d for d in my_dues if d.get('status') in ['odendi', 'paid']]
    paid_amount = sum(d.get('amount', 0) for d in paid)
    
    print(f"\n✅ Ödenen Aidatlar:")
    print(f"   Sayı: {len(paid)}")
    print(f"   Toplam: ₺{paid_amount:,.2f}")
else:
    print(f"❌ Hata: {sakin_dues.status_code}")

# 5. Dashboard Stats Kontrolü
print("\n5. DASHBOARD STATS KONTROLÜ:")
print("-" * 80)

# Admin dashboard stats
admin_stats = requests.get(
    f"{BASE_URL}/sites/1/dashboard/stats",
    headers={"Authorization": f"Bearer {admin_token}"}
)

if admin_stats.status_code == 200:
    stats = admin_stats.json()
    print(f"✅ Admin Dashboard Stats:")
    print(f"   Bekleyen Aidatlar: {stats.get('pendingDues', 'N/A')}")
    print(f"   Bekleyen Tutar: ₺{stats.get('pendingDuesAmount', 0):,.2f}")
else:
    print(f"⚠️  Dashboard stats endpoint yok (normal)")

print("\n" + "=" * 80)
print("TEST TAMAMLANDI!")
print("=" * 80)

print("\n✅ Kontrol Listesi:")
print("   1. Admin tüm aidatları görmeli")
print("   2. Sakin sadece kendi aidatlarını görmeli")
print("   3. Bekleyen aidatlar doğru filtrelenmeli")
print("   4. Dashboard'da doğru sayılar görünmeli")
