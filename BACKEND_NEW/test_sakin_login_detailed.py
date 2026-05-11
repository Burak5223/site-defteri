import requests
import json

BASE_URL = "http://localhost:8080/api"

print("=== TESTING SAKIN LOGIN DETAILED ===\n")

# Sakin login
print("Sakin login...")
sakin_login = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "sakin@site.com",
    "password": "sakin123"
})

print(f"Status: {sakin_login.status_code}")
print(f"\nFull Response:")
print(json.dumps(sakin_login.json(), indent=2))

sakin_data = sakin_login.json()
print(f"\n=== KEY FIELDS ===")
print(f"userId: {sakin_data.get('userId')}")
print(f"siteId: {sakin_data.get('siteId')}")
print(f"roles: {sakin_data.get('roles')}")
print(f"\nUser object:")
print(f"  apartmentId: {sakin_data.get('user', {}).get('apartmentId')}")
print(f"  blockName: {sakin_data.get('user', {}).get('blockName')}")
print(f"  unitNumber: {sakin_data.get('user', {}).get('unitNumber')}")
print(f"  status: {sakin_data.get('user', {}).get('status')}")

print("\n✓ Test completed!")
