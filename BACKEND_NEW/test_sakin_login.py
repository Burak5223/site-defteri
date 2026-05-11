import requests
import json

# Test login endpoint
url = "http://localhost:8080/api/auth/login"

payload = {
    "email": "sakin@site.com",
    "password": "sakin123"
}

print("=== SAKİN KULLANICI GİRİŞ TESTİ ===\n")
print(f"URL: {url}")
print(f"Payload: {json.dumps(payload, indent=2)}\n")

try:
    response = requests.post(url, json=payload)
    
    print(f"Status Code: {response.status_code}\n")
    
    if response.status_code == 200:
        data = response.json()
        print("✓ Giriş başarılı!")
        print(f"\nToken: {data.get('token', 'N/A')[:50]}...")
        
        user = data.get('user', {})
        print(f"\nKullanıcı Bilgileri:")
        print(f"  ID: {user.get('id')}")
        print(f"  Ad: {user.get('fullName')}")
        print(f"  Email: {user.get('email')}")
        print(f"  Telefon: {user.get('phone')}")
        print(f"  Site ID: {user.get('siteId')}")
        print(f"  Apartment ID: {user.get('apartmentId')}")
        print(f"  Block Name: {user.get('blockName')}")
        print(f"  Unit Number: {user.get('unitNumber')}")
        print(f"  Roller: {user.get('roles')}")
        
        if user.get('apartmentId'):
            print("\n✓ apartmentId mevcut - Paketler sayfası çalışmalı!")
        else:
            print("\n✗ apartmentId YOK - Paketler sayfası hata verecek!")
    else:
        print(f"✗ Giriş başarısız!")
        print(f"Response: {response.text}")
        
except Exception as e:
    print(f"✗ Hata: {e}")
