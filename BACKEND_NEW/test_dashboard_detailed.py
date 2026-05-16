import requests

BASE_URL = "http://localhost:8080/api"

# Login
login_data = {
    "email": "superadmin@site.com",
    "password": "super123"
}
response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
if response.status_code == 200:
    token = response.json()['accessToken']
    print("✓ Logged in successfully")
else:
    print(f"✗ Login failed: {response.status_code}")
    print(response.text)
    exit(1)

headers = {"Authorization": f"Bearer {token}"}

# Get dashboard stats
print("\nTesting dashboard API...")
response = requests.get(f"{BASE_URL}/super-admin/dashboard", headers=headers)
print(f"Status code: {response.status_code}")
if response.status_code == 200:
    stats = response.json()
    print("✓ Dashboard API working")
    print(f"Stats: {stats}")
else:
    print(f"✗ Dashboard API failed")
    print(f"Response: {response.text}")
