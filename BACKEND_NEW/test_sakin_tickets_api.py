import requests
import json

BASE_URL = "http://localhost:8080/api"

print("=" * 80)
print("SAKİN KULLANICISI ARIZA API TESTİ")
print("=" * 80)

# 1. Login as sakin
print("\n1. Sakin kullanıcısı ile giriş yapılıyor...")
login_response = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "sakin@site.com",
    "password": "sakin123"
})

if login_response.status_code == 200:
    login_data = login_response.json()
    print(f"   Response: {json.dumps(login_data, indent=2)}")
    
    # Try different possible token field names
    token = login_data.get('token') or login_data.get('accessToken') or login_data.get('jwt')
    user_id = login_data.get('userId') or login_data.get('id') or login_data.get('user', {}).get('id')
    
    if not token:
        print(f"❌ Token bulunamadı! Response: {login_data}")
        exit(1)
    
    print(f"✅ Giriş başarılı!")
    print(f"   User ID: {user_id}")
    print(f"   Token: {token[:50]}...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # 2. Get my tickets
    print("\n2. Arızalar getiriliyor (GET /api/tickets/my)...")
    tickets_response = requests.get(f"{BASE_URL}/tickets/my", headers=headers)
    
    print(f"   Status Code: {tickets_response.status_code}")
    
    if tickets_response.status_code == 200:
        tickets = tickets_response.json()
        print(f"   ✅ Arızalar başarıyla getirildi!")
        print(f"   Toplam Arıza: {len(tickets)}")
        
        for i, ticket in enumerate(tickets, 1):
            print(f"\n   Arıza {i}:")
            print(f"      ID: {ticket.get('id')}")
            print(f"      Başlık: {ticket.get('title')}")
            print(f"      Durum: {ticket.get('status')}")
            print(f"      Apartment ID: {ticket.get('apartmentId')}")
            print(f"      User ID: {ticket.get('userId')}")
    else:
        print(f"   ❌ Hata: {tickets_response.text}")
    
    # 3. Get dashboard stats
    print("\n3. Dashboard istatistikleri getiriliyor...")
    dashboard_response = requests.get(f"{BASE_URL}/dashboard/resident", headers=headers)
    
    if dashboard_response.status_code == 200:
        dashboard = dashboard_response.json()
        print(f"   ✅ Dashboard başarıyla getirildi!")
        print(f"   Açık Arıza Sayısı: {dashboard.get('openTickets', 0)}")
        print(f"   Bekleyen Aidat: {dashboard.get('pendingDues', 0)}")
        print(f"   Bekleyen Paket: {dashboard.get('pendingPackages', 0)}")
    else:
        print(f"   ❌ Hata: {dashboard_response.text}")
        
else:
    print(f"❌ Giriş başarısız: {login_response.text}")

print("\n" + "=" * 80)
