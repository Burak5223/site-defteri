import requests
import json

BASE_URL = "http://localhost:8080/api"

# 1. Sakin login
print("1️⃣ Sakin login...")
login_response = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "sakin@site.com",
    "password": "sakin123"
})

if login_response.status_code == 200:
    login_data = login_response.json()
    token = login_data.get('accessToken')
    user = login_data.get('user', {})
    print(f"✅ Login successful")
    print(f"   User: {user.get('fullName')}")
    print(f"   User ID: {user.get('id')}")
    print(f"   Site ID: {user.get('siteId')}")
    print(f"   Apartment ID: {user.get('apartmentId')}")
    
    # 2. Get tickets
    print("\n2️⃣ Getting tickets...")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Try different endpoints
    print("\n   Trying /tickets endpoint...")
    tickets_response = requests.get(f"{BASE_URL}/tickets", headers=headers)
    print(f"   Status: {tickets_response.status_code}")
    if tickets_response.status_code == 200:
        tickets = tickets_response.json()
        print(f"   ✅ Found {len(tickets)} tickets")
        for ticket in tickets[:3]:
            print(f"      - {ticket.get('title')} (Status: {ticket.get('status')})")
    else:
        print(f"   ❌ Error: {tickets_response.text}")
    
    print("\n   Trying /sites/{siteId}/tickets endpoint...")
    site_tickets_response = requests.get(
        f"{BASE_URL}/sites/{user.get('siteId')}/tickets", 
        headers=headers
    )
    print(f"   Status: {site_tickets_response.status_code}")
    if site_tickets_response.status_code == 200:
        tickets = site_tickets_response.json()
        print(f"   ✅ Found {len(tickets)} tickets")
        for ticket in tickets[:3]:
            print(f"      - {ticket.get('title')} (Status: {ticket.get('status')})")
    else:
        print(f"   ❌ Error: {site_tickets_response.text}")
    
    print("\n   Trying /users/{userId}/tickets endpoint...")
    user_tickets_response = requests.get(
        f"{BASE_URL}/users/{user.get('id')}/tickets", 
        headers=headers
    )
    print(f"   Status: {user_tickets_response.status_code}")
    if user_tickets_response.status_code == 200:
        tickets = user_tickets_response.json()
        print(f"   ✅ Found {len(tickets)} tickets")
        for ticket in tickets[:3]:
            print(f"      - {ticket.get('title')} (Status: {ticket.get('status')})")
    else:
        print(f"   ❌ Error: {user_tickets_response.text}")
        
else:
    print(f"❌ Login failed: {login_response.status_code}")
    print(login_response.text)
