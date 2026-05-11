import requests
import json

# Use the token from admin@site.com
token = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiUk9MRV9BRE1JTiIsInNpdGVJZCI6IjEiLCJ1c2VySWQiOiI2OWY2ZGRlMi00OTI3LTQyMGEtYWEzYi1lOTIyNmY1Y2ZkYmUiLCJlbWFpbCI6ImFkbWluQHNpdGUuY29tIiwic3ViIjoiNjlmNmRkZTItNDkyNy00MjBhLWFhM2ItZTkyMjZmNWNmZGJlIiwiaWF0IjoxNzc4MjQzNjM0LCJleHAiOjE3NzgzMzAwMzR9.agmwVaygY3SoPk5S7BcGG1x88iXl9lS9JPI584ItIbE"

headers = {
    "Authorization": f"Bearer {token}"
}

# Test A Block (ID: 1)
print("=== TESTING A BLOCK (ID: 1) ===\n")
url = "http://localhost:8080/api/blocks/1/apartments-with-residents"
response = requests.get(url, headers=headers)

print(f"Status: {response.status_code}")

if response.status_code == 200:
    apartments = response.json()
    print(f"Total apartments returned: {len(apartments)}\n")
    
    if len(apartments) > 0:
        print("First 3 apartments:")
        for apt in apartments[:3]:
            print(f"\nApartment {apt.get('unitNumber')}:")
            print(f"  Floor: {apt.get('floor')}")
            print(f"  Owner: {apt.get('ownerName', 'N/A')}")
            print(f"  Resident: {apt.get('residentName', 'N/A')}")
            print(f"  Owner ID: {apt.get('ownerUserId', 'N/A')}")
            print(f"  Resident ID: {apt.get('currentResidentId', 'N/A')}")
    else:
        print("⚠️ NO APARTMENTS RETURNED!")
else:
    print(f"Error: {response.text}")

print("\n" + "="*50 + "\n")

# Also test the blocks endpoint
print("=== TESTING BLOCKS ENDPOINT ===\n")
url = "http://localhost:8080/api/sites/1/blocks"
response = requests.get(url, headers=headers)

if response.status_code == 200:
    blocks = response.json()
    for block in blocks:
        print(f"Block: {block['name']}")
        print(f"  Total Apartments: {block.get('totalApartments', 0)}")
        print(f"  Total Owners: {block.get('totalOwners', 0)}")
        print(f"  Total Tenants: {block.get('totalTenants', 0)}")
        print(f"  Total Residents: {block.get('totalResidents', 0)}")
        print()
