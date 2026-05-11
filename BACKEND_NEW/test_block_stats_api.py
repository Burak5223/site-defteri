import requests
import json

# API endpoint
base_url = "http://localhost:8080/api"

# Login first to get token
login_data = {
    "email": "admin@site.com",
    "password": "admin123"
}

print("=== Logging in ===")
response = requests.post(f"{base_url}/auth/login", json=login_data)
if response.status_code == 200:
    response_data = response.json()
    print(f"Response: {json.dumps(response_data, indent=2)}")
    # Try different possible token field names
    token = response_data.get('token') or response_data.get('accessToken') or response_data.get('jwt')
    if not token:
        print("✗ No token found in response")
        exit(1)
    print(f"✓ Login successful")
else:
    print(f"✗ Login failed: {response.status_code}")
    print(response.text)
    exit(1)

# Get blocks
headers = {"Authorization": f"Bearer {token}"}

print("\n=== Fetching blocks for site 1 ===")
response = requests.get(f"{base_url}/sites/1/blocks", headers=headers)

if response.status_code == 200:
    blocks = response.json()
    print(f"✓ Found {len(blocks)} blocks\n")
    
    for block in blocks:
        print(f"{block['name']}:")
        print(f"  Total Apartments: {block.get('totalApartments', 'N/A')}")
        print(f"  Total Residents: {block.get('totalResidents', 'N/A')}")
        print(f"  Total Owners: {block.get('totalOwners', 'N/A')}")
        print(f"  Total Tenants: {block.get('totalTenants', 'N/A')}")
        print()
else:
    print(f"✗ Failed to fetch blocks: {response.status_code}")
    print(response.text)
