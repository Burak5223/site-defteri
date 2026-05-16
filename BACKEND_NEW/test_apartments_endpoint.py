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
    print("✓ Logged in successfully\n")
else:
    print(f"✗ Login failed: {response.status_code}")
    exit(1)

headers = {"Authorization": f"Bearer {token}"}

# Get all sites
print("1. Getting all sites...")
response = requests.get(f"{BASE_URL}/super-admin/sites", headers=headers)
if response.status_code == 200:
    sites = response.json()
    print(f"✓ Found {len(sites)} sites\n")
    
    print("Sites with apartment counts:")
    print("=" * 70)
    for site in sites:
        print(f"{site['name']}: {site['totalApartments']} daire, {site['totalResidents']} sakin")
    print("=" * 70)
    
    # Test apartments endpoint for first site
    if sites:
        test_site = sites[0]
        print(f"\n2. Getting apartments for {test_site['name']}...")
        response = requests.get(
            f"{BASE_URL}/super-admin/sites/{test_site['id']}/apartments",
            headers=headers
        )
        if response.status_code == 200:
            apartments = response.json()
            print(f"✓ Found {len(apartments)} apartments\n")
            
            # Show first 10 apartments
            print("First 10 apartments:")
            print("-" * 70)
            for apt in apartments[:10]:
                occupied = "✓ Dolu" if apt['isOccupied'] else "○ Boş"
                print(f"{apt['blockName']}-{apt['unitNumber']}: {occupied} ({apt['residentCount']} sakin)")
            print("-" * 70)
            
            # Statistics
            occupied_count = sum(1 for apt in apartments if apt['isOccupied'])
            empty_count = len(apartments) - occupied_count
            occupancy_rate = (occupied_count / len(apartments) * 100) if apartments else 0
            
            print(f"\nStatistics:")
            print(f"  Total: {len(apartments)} daire")
            print(f"  Dolu: {occupied_count} daire")
            print(f"  Boş: {empty_count} daire")
            print(f"  Doluluk Oranı: %{occupancy_rate:.1f}")
            
            print("\n✓ ALL TESTS PASSED!")
        else:
            print(f"✗ Failed to get apartments: {response.status_code}")
            print(response.text)
    else:
        print("No sites found")
else:
    print(f"✗ Failed to get sites: {response.status_code}")
    print(response.text)
