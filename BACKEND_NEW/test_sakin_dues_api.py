import requests
import json

# Test sakin kullanıcısı ile login yap
login_url = "http://localhost:8080/api/auth/login"
login_data = {
    "email": "sakin@site.com",
    "password": "sakin123"
}

print("1. Sakin kullanıcısı ile giriş yapılıyor...")
try:
    login_response = requests.post(login_url, json=login_data)
    print(f"   Status: {login_response.status_code}")
    
    if login_response.status_code == 200:
        login_result = login_response.json()
        token = login_result.get('token')
        user_id = login_result.get('userId')
        print(f"   ✓ Giriş başarılı! User ID: {user_id}")
        print(f"   Token: {token[:50]}...")
        
        # Aidatları çek
        print("\n2. Aidatlar çekiliyor (/api/dues/my)...")
        dues_url = "http://localhost:8080/api/dues/my"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        dues_response = requests.get(dues_url, headers=headers)
        print(f"   Status: {dues_response.status_code}")
        
        if dues_response.status_code == 200:
            dues = dues_response.json()
            print(f"   ✓ {len(dues)} aidat bulundu:")
            for due in dues:
                print(f"     - {due.get('amount')} TL, Vade: {due.get('dueDate')}, Durum: {due.get('status')}")
                print(f"       Daire: {due.get('apartmentNumber')}, Period: {due.get('period')}")
        else:
            print(f"   ❌ Hata: {dues_response.text}")
    else:
        print(f"   ❌ Giriş başarısız: {login_response.text}")
        
except Exception as e:
    print(f"❌ Hata: {e}")
