import requests
import json

BASE_URL = "http://localhost:8080/api"

# Test users - all in Site 1
users = [
    {"email": "admin@site.com", "password": "admin123", "role": "ADMIN"},
    {"email": "sakin@site.com", "password": "sakin123", "role": "RESIDENT"},
    {"email": "security@site.com", "password": "security123", "role": "SECURITY"},
    {"email": "cleaning@site.com", "password": "cleaning123", "role": "CLEANING"}
]

print("=" * 80)
print("TESTING TICKETS PAGE API FOR ALL ROLES")
print("=" * 80)

for user in users:
    try:
        # Login
        response = requests.post(f"{BASE_URL}/auth/login", json={
            "email": user["email"],
            "password": user["password"]
        })
        
        if response.status_code != 200:
            print(f"\n{user['role']} - Login FAILED: {response.status_code}")
            print(f"Response: {response.text}")
            continue
            
        data = response.json()
        token = data.get("accessToken") or data.get("token")
        headers = {"Authorization": f"Bearer {token}"}
        
        print(f"\n{user['role']} ({user['email']}):")
        print(f"  Token: {token[:50]}...")
        
        # Test /api/tickets/my endpoint
        tickets_response = requests.get(f"{BASE_URL}/tickets/my", headers=headers)
        print(f"  GET /api/tickets/my - Status: {tickets_response.status_code}")
        
        if tickets_response.status_code == 200:
            tickets = tickets_response.json()
            print(f"  Tickets count: {len(tickets)}")
            
            if len(tickets) > 0:
                print(f"  First 3 tickets:")
                for ticket in tickets[:3]:
                    print(f"    - {ticket.get('ticketNumber')}: {ticket.get('title')} ({ticket.get('status')})")
            else:
                print(f"  ⚠️  NO TICKETS RETURNED!")
        else:
            print(f"  ERROR: {tickets_response.text}")
            
    except Exception as e:
        print(f"\n{user['role']} - ERROR: {str(e)}")

print("\n" + "=" * 80)
print("EXPECTED: All roles should see 10 tickets from Site 1")
print("=" * 80)
