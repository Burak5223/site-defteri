import requests

BASE_URL = "http://localhost:8080/api"

# Test users - all in Site 1
users = [
    {"email": "admin@site.com", "password": "admin123", "role": "ADMIN"},
    {"email": "sakin@site.com", "password": "sakin123", "role": "RESIDENT"},
    {"email": "security@site.com", "password": "security123", "role": "SECURITY"},
    {"email": "cleaning@site.com", "password": "cleaning123", "role": "CLEANING"}
]

print("=" * 80)
print("TESTING ALL ROLES - DASHBOARD & TICKET PAGE")
print("=" * 80)

for user in users:
    try:
        # Login
        response = requests.post(f"{BASE_URL}/auth/login", json={
            "email": user["email"],
            "password": user["password"]
        })
        
        if response.status_code != 200:
            print(f"\n{user['role']} - Login FAILED")
            continue
            
        data = response.json()
        token = data.get("accessToken") or data.get("token")
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get dashboard
        dashboard_response = requests.get(f"{BASE_URL}/dashboard", headers=headers)
        dashboard = dashboard_response.json()
        
        # Get tickets
        tickets_response = requests.get(f"{BASE_URL}/tickets/my", headers=headers)
        tickets = tickets_response.json()
        
        print(f"\n{user['role']} ({user['email']}):")
        print(f"  Dashboard - Open Tickets: {dashboard.get('openTickets', 0)}")
        print(f"  Dashboard - Total Tickets: {dashboard.get('totalTickets', 0)}")
        print(f"  Ticket Page - Count: {len(tickets)}")
        
        # Check consistency
        if dashboard.get('openTickets', 0) == 0 and len(tickets) > 0:
            print(f"  ⚠️  WARNING: Dashboard shows 0 but ticket page shows {len(tickets)}")
        elif dashboard.get('openTickets', 0) == 7 and len(tickets) == 10:
            print(f"  ✓ Dashboard and ticket page are consistent")
            
    except Exception as e:
        print(f"\n{user['role']} - ERROR: {str(e)}")

print("\n" + "=" * 80)
print("EXPECTED:")
print("  - All dashboards should show 7 open tickets")
print("  - All ticket pages should show 10 total tickets")
print("=" * 80)
