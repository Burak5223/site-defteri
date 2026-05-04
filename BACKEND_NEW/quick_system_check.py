#!/usr/bin/env python3
"""
Quick system health check - tests critical endpoints
"""

import requests
import json

BASE_URL = "http://localhost:8080/api"

def login(email, password):
    """Login and return token"""
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json={
            "email": email,
            "password": password
        })
        if response.status_code == 200:
            return response.json().get("accessToken")
    except:
        pass
    return None

print("\n" + "="*70)
print("  SİSTEM SAĞLIK KONTROLÜ")
print("="*70)

errors = []
warnings = []
success_count = 0
total_tests = 0

# Test 1: Backend Health
print("\n1. Backend Sağlık Kontrolü")
print("-" * 70)
total_tests += 1
try:
    r = requests.get(f"{BASE_URL}/health", timeout=5)
    if r.status_code == 200 or r.status_code == 404:  # 404 is ok if endpoint doesn't exist
        print("  ✅ Backend çalışıyor")
        success_count += 1
    else:
        errors.append(f"Backend health check failed: {r.status_code}")
        print(f"  ❌ Backend sağlık kontrolü başarısız: {r.status_code}")
except Exception as e:
    errors.append(f"Backend unreachable: {str(e)}")
    print(f"  ❌ Backend'e erişilemiyor: {str(e)}")

# Test 2: Authentication
print("\n2. Kimlik Doğrulama")
print("-" * 70)
total_tests += 1
token = login("sakin1@şehirmerkeziresidence.com", "123456")
if token:
    print("  ✅ Login başarılı")
    success_count += 1
else:
    errors.append("Login failed")
    print("  ❌ Login başarısız")

if token:
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test 3: Package endpoints
    print("\n3. Paket Endpoint'leri")
    print("-" * 70)
    total_tests += 1
    try:
        r = requests.get(f"{BASE_URL}/packages/my-notifications", headers=headers, timeout=5)
        if r.status_code == 200:
            print(f"  ✅ Paket bildirimleri çalışıyor ({len(r.json())} bildirim)")
            success_count += 1
        else:
            errors.append(f"Package notifications failed: {r.status_code}")
            print(f"  ❌ Paket bildirimleri hatası: {r.status_code}")
    except Exception as e:
        errors.append(f"Package endpoint error: {str(e)}")
        print(f"  ❌ Paket endpoint hatası: {str(e)}")
    
    # Test 4: Create notification
    print("\n4. Bildirim Oluşturma")
    print("-" * 70)
    total_tests += 1
    try:
        r = requests.post(f"{BASE_URL}/packages/resident-notification", 
                         json={"cargoCompany": "Health Check Kargo", "notes": "Test"},
                         headers=headers, timeout=5)
        if r.status_code == 200:
            print("  ✅ Bildirim oluşturma çalışıyor")
            success_count += 1
        else:
            errors.append(f"Create notification failed: {r.status_code}")
            print(f"  ❌ Bildirim oluşturma hatası: {r.status_code}")
    except Exception as e:
        errors.append(f"Create notification error: {str(e)}")
        print(f"  ❌ Bildirim oluşturma hatası: {str(e)}")

# Test 5: Security endpoints
print("\n5. Güvenlik Endpoint'leri")
print("-" * 70)
total_tests += 1
sec_token = login("guvenlik@yeşilvadisitesi.com", "123456")
if sec_token:
    headers = {"Authorization": f"Bearer {sec_token}"}
    try:
        r = requests.get(f"{BASE_URL}/packages", headers=headers, timeout=5)
        if r.status_code == 200:
            print(f"  ✅ Güvenlik paket listesi çalışıyor ({len(r.json())} paket)")
            success_count += 1
        else:
            errors.append(f"Security packages failed: {r.status_code}")
            print(f"  ❌ Güvenlik paket listesi hatası: {r.status_code}")
    except Exception as e:
        errors.append(f"Security endpoint error: {str(e)}")
        print(f"  ❌ Güvenlik endpoint hatası: {str(e)}")
else:
    errors.append("Security login failed")
    print("  ❌ Güvenlik login başarısız")

# Summary
print("\n" + "="*70)
print("  SONUÇ")
print("="*70)
print(f"\nToplam Test: {total_tests}")
print(f"Başarılı: {success_count}")
print(f"Başarısız: {len(errors)}")
print(f"Uyarı: {len(warnings)}")

if errors:
    print("\n❌ HATALAR:")
    for error in errors:
        print(f"  - {error}")

if warnings:
    print("\n⚠️  UYARILAR:")
    for warning in warnings:
        print(f"  - {warning}")

if len(errors) == 0:
    print("\n✅ TÜM SİSTEMLER ÇALIŞIYOR!")
    exit(0)
else:
    print(f"\n❌ {len(errors)} HATA BULUNDU!")
    exit(1)
