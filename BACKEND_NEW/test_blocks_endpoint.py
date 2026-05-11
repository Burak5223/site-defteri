import requests
import json

# Use the token from the mobile app (from backend logs)
token = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiUk9MRV9BRE1JTiIsInNpdGVJZCI6IjEiLCJ1c2VySWQiOiJjNDFhYjdlZC1iZWUwLTRmMDctYTJiYi04NzJiMzgzZjk5N2EiLCJlbWFpbCI6ImFkbWluQHNpdGUuY29tIiwic3ViIjoiYzQxYWI3ZWQtYmVlMC00ZjA3LWEyYmItODcyYjM4M2Y5OTdhIiwiaWF0IjoxNzc4MjM5Mzk0LCJleHAiOjE3NzgzMjU3OTR9.l_BSyFD5ibWU0jLQ0R-qIgeQSmv9B4GSQG5ezPsQMBE"

# Call the blocks endpoint
blocks_url = "http://localhost:8080/api/sites/1/blocks"
headers = {
    "Authorization": f"Bearer {token}"
}

print("=== CALLING BLOCKS ENDPOINT ===")
print(f"URL: {blocks_url}")

response = requests.get(blocks_url, headers=headers)
print(f"Status: {response.status_code}")

if response.status_code == 200:
    blocks = response.json()
    print(f"\n=== BLOCKS DATA ===")
    print(json.dumps(blocks, indent=2, ensure_ascii=False))
    
    print("\n=== SUMMARY ===")
    for block in blocks:
        print(f"\nBlock: {block['name']}")
        print(f"  Total Apartments: {block.get('totalApartments', 0)}")
        print(f"  Total Owners: {block.get('totalOwners', 0)}")
        print(f"  Total Tenants: {block.get('totalTenants', 0)}")
        print(f"  Total Residents: {block.get('totalResidents', 0)}")
else:
    print(f"Error: {response.text}")
