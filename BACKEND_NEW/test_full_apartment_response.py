import requests
import json

# Login first
login_url = "http://localhost:8080/api/auth/login"
login_data = {
    "email": "admin@site.com",
    "password": "admin123"
}

response = requests.post(login_url, json=login_data)
if response.status_code != 200:
    print(f"Login failed: {response.status_code} - {response.text}")
    exit(1)
    
response_data = response.json()
token = response_data.get('token') or response_data.get('accessToken')

headers = {
    "Authorization": f"Bearer {token}"
}

# Get apartments with residents
url = "http://localhost:8080/api/blocks/1/apartments-with-residents"
response = requests.get(url, headers=headers)

if response.status_code == 200:
    apartments = response.json()
    
    print("=== FULL RESPONSE FOR FIRST APARTMENT ===\n")
    if len(apartments) > 0:
        print(json.dumps(apartments[0], indent=2, ensure_ascii=False))
        
        print("\n=== CHECKING FIELD NAMES ===\n")
        apt = apartments[0]
        print(f"Has 'ownerName': {'ownerName' in apt}")
        print(f"Has 'currentResidentName': {'currentResidentName' in apt}")
        print(f"Has 'residentName': {'residentName' in apt}")
        
        print(f"\nOwner Name: {apt.get('ownerName', 'NOT FOUND')}")
        print(f"Current Resident Name: {apt.get('currentResidentName', 'NOT FOUND')}")
        print(f"Resident Name: {apt.get('residentName', 'NOT FOUND')}")
        
        print(f"\nOwner ID: {apt.get('ownerUserId', 'NOT FOUND')}")
        print(f"Current Resident ID: {apt.get('currentResidentId', 'NOT FOUND')}")
else:
    print(f"Error: {response.status_code} - {response.text}")
