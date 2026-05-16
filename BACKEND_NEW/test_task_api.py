#!/usr/bin/env python3
"""
Görev API endpoint testleri
"""

import requests
import json

BASE_URL = "http://localhost:8080/api"

print("=" * 80)
print("GÖREV API TESTLERİ")
print("=" * 80)

# 1. Güvenlik kullanıcısı ile giriş
print("\n1. GÜVENLİK KULLANICISI GİRİŞİ:")
login_data = {
    "email": "guvenlik@site.com",
    "password": "123456"
}

try:
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if response.status_code == 200:
        security_token = response.json()['token']
        security_user = response.json()['user']
        print(f"✓ Giriş başarılı: {security_user['fullName']}")
        print(f"  Token: {security_token[:50]}...")
    else:
        print(f"✗ Giriş başarısız: {response.status_code}")
        print(f"  Hata: {response.text}")
        exit(1)
except Exception as e:
    print(f"✗ Bağlantı hatası: {e}")
    print("  Backend çalışıyor mu kontrol edin!")
    exit(1)

# 2. Güvenlik kullanıcısının görevlerini getir
print("\n2. GÜVENLİK KULLANICISININ GÖREVLERİ:")
headers = {"Authorization": f"Bearer {security_token}"}

try:
    response = requests.get(f"{BASE_URL}/tasks", headers=headers)
    if response.status_code == 200:
        tasks = response.json()
        print(f"✓ {len(tasks)} görev bulundu")
        
        # İstatistikler
        ongoing = sum(1 for t in tasks if t.get('status') == 'devam_ediyor')
        completed = sum(1 for t in tasks if t.get('status') == 'tamamlandi')
        pending = sum(1 for t in tasks if t.get('status') == 'bekliyor')
        
        print(f"  Devam Eden: {ongoing}")
        print(f"  Tamamlanan: {completed}")
        print(f"  Bekleyen: {pending}")
        
        # İlk 3 görevi göster
        print("\n  İlk 3 görev:")
        for task in tasks[:3]:
            print(f"    • {task.get('title')} - {task.get('status')}")
    else:
        print(f"✗ Görevler getirilemedi: {response.status_code}")
        print(f"  Hata: {response.text}")
except Exception as e:
    print(f"✗ Hata: {e}")

# 3. Temizlik kullanıcısı ile giriş
print("\n3. TEMİZLİK KULLANICISI GİRİŞİ:")
login_data = {
    "email": "temizlik@site.com",
    "password": "123456"
}

try:
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if response.status_code == 200:
        cleaning_token = response.json()['token']
        cleaning_user = response.json()['user']
        print(f"✓ Giriş başarılı: {cleaning_user['fullName']}")
    else:
        print(f"✗ Giriş başarısız: {response.status_code}")
except Exception as e:
    print(f"✗ Hata: {e}")

# 4. Temizlik kullanıcısının görevlerini getir
print("\n4. TEMİZLİK KULLANICISININ GÖREVLERİ:")
headers = {"Authorization": f"Bearer {cleaning_token}"}

try:
    response = requests.get(f"{BASE_URL}/tasks", headers=headers)
    if response.status_code == 200:
        tasks = response.json()
        print(f"✓ {len(tasks)} görev bulundu")
        
        # İstatistikler
        ongoing = sum(1 for t in tasks if t.get('status') == 'devam_ediyor')
        completed = sum(1 for t in tasks if t.get('status') == 'tamamlandi')
        pending = sum(1 for t in tasks if t.get('status') == 'bekliyor')
        
        print(f"  Devam Eden: {ongoing}")
        print(f"  Tamamlanan: {completed}")
        print(f"  Bekleyen: {pending}")
        
        # İlk 3 görevi göster
        print("\n  İlk 3 görev:")
        for task in tasks[:3]:
            print(f"    • {task.get('title')} - {task.get('status')}")
    else:
        print(f"✗ Görevler getirilemedi: {response.status_code}")
except Exception as e:
    print(f"✗ Hata: {e}")

# 5. Dashboard istatistikleri
print("\n5. DASHBOARD İSTATİSTİKLERİ:")
headers = {"Authorization": f"Bearer {security_token}"}

try:
    response = requests.get(f"{BASE_URL}/dashboard/stats", headers=headers)
    if response.status_code == 200:
        stats = response.json()
        print(f"✓ Dashboard verileri alındı")
        print(f"  Toplam Görev: {stats.get('totalTasks', 0)}")
        print(f"  Devam Eden: {stats.get('ongoingTasks', 0)}")
        print(f"  Tamamlanan: {stats.get('completedTasks', 0)}")
    else:
        print(f"✗ Dashboard verileri alınamadı: {response.status_code}")
except Exception as e:
    print(f"✗ Hata: {e}")

print("\n" + "=" * 80)
print("✓ API testleri tamamlandı!")
print("=" * 80)
