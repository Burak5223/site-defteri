import requests

BASE_URL = "http://localhost:8080/api"

# Test users
users = [
    {"email": "security@site.com", "password": "security123", "role": "SECURITY"},
    {"email": "cleaning@site.com", "password": "cleaning123", "role": "CLEANING"}
]

print("=" * 80)
print("TESTING SECURITY & CLEANING DASHBOARDS")
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
        
        print(f"\n{user['role']} ({user['email']}):")
        print(f"  Dashboard API Status: {dashboard_response.status_code}")
        
        if dashboard_response.status_code == 200:
            dashboard = dashboard_response.json()
            print(f"  Dashboard Data:")
            print(f"    - Total Tasks: {dashboard.get('totalTasks', 'N/A')}")
            print(f"    - Completed Tasks: {dashboard.get('completedTasks', 'N/A')}")
            print(f"    - Pending Tasks: {dashboard.get('pendingTasks', 'N/A')}")
            print(f"    - Open Tickets: {dashboard.get('openTickets', 'N/A')}")
            print(f"    - Waiting Packages: {dashboard.get('waitingPackages', 'N/A')}")
            
            if dashboard.get('totalTasks') == 0 or dashboard.get('totalTasks') is None:
                print(f"  ⚠️  WARNING: No tasks showing in dashboard!")
        else:
            print(f"  ERROR: {dashboard_response.text}")
            
    except Exception as e:
        print(f"\n{user['role']} - ERROR: {str(e)}")

print("\n" + "=" * 80)
print("EXPECTED:")
print("  - Security: 5 total tasks, 1 completed, 4 pending")
print("  - Cleaning: 7 total tasks, 2 completed, 5 pending")
print("=" * 80)
