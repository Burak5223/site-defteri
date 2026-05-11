import requests
import json

# Backend URL
BASE_URL = "http://localhost:8080/api"

# Test için bir token al (admin kullanıcısı ile)
# Önce login yap
login_data = {
    "emailOrPhone": "admin@test.com",  # Admin email
    "password": "admin123"
}

try:
    # Login
    print("=== LOGIN ===\n")
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        auth_data = response.json()
        token = auth_data.get('token')
        print(f"Token alındı: {token[:50]}...\n")
        
        # Blokları getir
        print("=== BLOKLAR (Site 1) ===\n")
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/sites/1/blocks", headers=headers)
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            blocks = response.json()
            print(f"Toplam {len(blocks)} blok bulundu\n")
            
            for block in blocks:
                print(f"{block['name']}:")
                print(f"  ID: {block['id']}")
                print(f"  Toplam Daire: {block.get('totalApartments', 0)}")
                print(f"  Toplam Sakin: {block.get('totalResidents', 0)}")
                print(f"  Malikler: {block.get('totalOwners', 0)}")
                print(f"  Kiracılar: {block.get('totalTenants', 0)}\n")
        else:
            print(f"Hata: {response.text}")
    else:
        print(f"Login başarısız: {response.text}")
        
except Exception as e:
    print(f"Hata: {e}")
