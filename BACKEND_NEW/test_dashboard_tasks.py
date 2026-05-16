#!/usr/bin/env python3
"""
Dashboard API'sini test et - Görevlerin görünüp görünmediğini kontrol et
"""

import requests
import json

BASE_URL = "http://localhost:8080/api"

print("=" * 80)
print("DASHBOARD GÖREV TESTİ")
print("=" * 80)

# Test kullanıcıları
test_users = [
    {
        "email": "guvenlik@site.com",
        "password": "guvenlik123",
        "name": "Güvenlik User"
    },
    {
        "email": "temizlik@site.com",
        "password": "temizlik123",
        "name": "Temizlik User"
    }
]

for user in test_users:
    print(f"\n{'=' * 80}")
    print(f"TEST: {user['name']} ({user['email']})")
    print("=" * 80)
    
    # 1. Login
    print("\n1. Giriş yapılıyor...")
    login_response = requests.post(
        f"{BASE_URL}/auth/login",
        json={
            "email": user['email'],
            "password": user['password']
        }
    )
    
    if login_response.status_code != 200:
        print(f"❌ Giriş başarısız: {login_response.status_code}")
        print(f"   Yanıt: {login_response.text}")
        continue
    
    login_data = login_response.json()
    print(f"   Login yanıtı: {json.dumps(login_data, indent=2, ensure_ascii=False)}")
    
    # Token'ı bul (farklı field'larda olabilir)
    token = login_data.get('token') or login_data.get('accessToken') or login_data.get('data', {}).get('token')
    
    if not token:
        print(f"❌ Token bulunamadı!")
        continue
    
    print(f"✓ Giriş başarılı")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # 2. Dashboard verilerini al
    print("\n2. Dashboard verileri alınıyor...")
    dashboard_response = requests.get(
        f"{BASE_URL}/users/me/dashboard",
        headers=headers
    )
    
    if dashboard_response.status_code != 200:
        print(f"❌ Dashboard verisi alınamadı: {dashboard_response.status_code}")
        print(f"   Yanıt: {dashboard_response.text}")
        continue
    
    dashboard_data = dashboard_response.json()
    print(f"✓ Dashboard verileri alındı")
    
    # 3. Görev istatistiklerini göster
    print("\n3. GÖREV İSTATİSTİKLERİ:")
    if 'totalTasks' in dashboard_data:
        print(f"   Toplam görev: {dashboard_data.get('totalTasks', 0)}")
    if 'pendingTasks' in dashboard_data:
        print(f"   Bekleyen görev: {dashboard_data.get('pendingTasks', 0)}")
    if 'completedTasks' in dashboard_data:
        print(f"   Tamamlanan görev: {dashboard_data.get('completedTasks', 0)}")
    if 'ongoingTasks' in dashboard_data:
        print(f"   Devam eden görev: {dashboard_data.get('ongoingTasks', 0)}")
    
    # 4. Bugünkü görevleri al
    print("\n4. Bugünkü görevler alınıyor...")
    tasks_response = requests.get(
        f"{BASE_URL}/tasks",
        headers=headers
    )
    
    if tasks_response.status_code != 200:
        print(f"❌ Görevler alınamadı: {tasks_response.status_code}")
        print(f"   Yanıt: {tasks_response.text}")
        continue
    
    tasks = tasks_response.json()
    print(f"✓ {len(tasks)} görev bulundu")
    
    # 5. Görevleri listele
    if tasks:
        print("\n5. GÖREV LİSTESİ:")
        for i, task in enumerate(tasks[:5], 1):  # İlk 5 görevi göster
            print(f"\n   {i}. {task.get('title', 'Başlık yok')}")
            print(f"      Durum: {task.get('status', 'Bilinmiyor')}")
            print(f"      Tür: {task.get('taskType', 'Bilinmiyor')}")
            print(f"      Bitiş: {task.get('dueDate', 'Belirtilmemiş')}")
            if task.get('description'):
                print(f"      Açıklama: {task['description'][:50]}...")
    else:
        print("\n⚠ Hiç görev bulunamadı!")
    
    # 6. Dashboard'da görev sayısı kontrolü
    print("\n6. DASHBOARD KONTROLÜ:")
    dashboard_task_count = dashboard_data.get('totalTasks', 0)
    actual_task_count = len(tasks)
    
    if dashboard_task_count == actual_task_count:
        print(f"   ✓ Dashboard görev sayısı doğru: {dashboard_task_count}")
    else:
        print(f"   ⚠ Dashboard görev sayısı uyuşmuyor!")
        print(f"      Dashboard: {dashboard_task_count}")
        print(f"      Gerçek: {actual_task_count}")

print("\n" + "=" * 80)
print("✓ Test tamamlandı!")
print("=" * 80)
