#!/usr/bin/env python3
"""
Test the fixed residents endpoint
"""
import requests
import json

print("=" * 80)
print("TESTING FIXED RESIDENTS ENDPOINT")
print("=" * 80)

# Test apartment residents endpoint
print("\n1. Testing A Blok Daire 12 residents...")
try:
    # First get apartment ID for A Blok Daire 12
    response = requests.get("http://localhost:8080/api/sites/1/blocks", 
                          headers={"Authorization": "Bearer admin_token_here"})
    
    if response.status_code == 200:
        blocks = response.json()
        a_blok = next((b for b in blocks if b['name'] == 'A Blok'), None)
        
        if a_blok:
            print(f"✅ Found A Blok: {a_blok['id']}")
            
            # Get apartments in A Blok
            response = requests.get(f"http://localhost:8080/api/blocks/{a_blok['id']}/apartments", 
                                  headers={"Authorization": "Bearer admin_token_here"})
            
            if response.status_code == 200:
                apartments = response.json()
                daire_12 = next((a for a in apartments if a['unitNumber'] == '12'), None)
                
                if daire_12:
                    print(f"✅ Found Daire 12: {daire_12['id']}")
                    
                    # Get residents in Daire 12
                    response = requests.get(f"http://localhost:8080/api/apartments/{daire_12['id']}/residents", 
                                          headers={"Authorization": "Bearer admin_token_here"})
                    
                    if response.status_code == 200:
                        residents = response.json()
                        print(f"✅ Found {len(residents)} resident(s) in A Blok Daire 12:")
                        for resident in residents:
                            print(f"   - {resident.get('fullName')} ({resident.get('email')})")
                            print(f"     Type: {resident.get('residentType')}")
                            print(f"     Phone: {resident.get('phone')}")
                    else:
                        print(f"❌ Failed to get residents: {response.status_code}")
                        print(f"Response: {response.text}")
                else:
                    print("❌ Daire 12 not found")
            else:
                print(f"❌ Failed to get apartments: {response.status_code}")
        else:
            print("❌ A Blok not found")
    else:
        print(f"❌ Failed to get blocks: {response.status_code}")
        
except Exception as e:
    print(f"❌ Request failed: {e}")

# Test B Blok Daire 36 residents
print("\n2. Testing B Blok Daire 36 residents...")
try:
    response = requests.get("http://localhost:8080/api/sites/1/blocks", 
                          headers={"Authorization": "Bearer admin_token_here"})
    
    if response.status_code == 200:
        blocks = response.json()
        b_blok = next((b for b in blocks if b['name'] == 'B Blok'), None)
        
        if b_blok:
            print(f"✅ Found B Blok: {b_blok['id']}")
            
            # Get apartments in B Blok
            response = requests.get(f"http://localhost:8080/api/blocks/{b_blok['id']}/apartments", 
                                  headers={"Authorization": "Bearer admin_token_here"})
            
            if response.status_code == 200:
                apartments = response.json()
                daire_36 = next((a for a in apartments if a['unitNumber'] == '36'), None)
                
                if daire_36:
                    print(f"✅ Found Daire 36: {daire_36['id']}")
                    
                    # Get residents in Daire 36
                    response = requests.get(f"http://localhost:8080/api/apartments/{daire_36['id']}/residents", 
                                          headers={"Authorization": "Bearer admin_token_here"})
                    
                    if response.status_code == 200:
                        residents = response.json()
                        print(f"✅ Found {len(residents)} resident(s) in B Blok Daire 36:")
                        for resident in residents:
                            print(f"   - {resident.get('fullName')} ({resident.get('email')})")
                            print(f"     Type: {resident.get('residentType')}")
                            print(f"     Phone: {resident.get('phone')}")
                    else:
                        print(f"❌ Failed to get residents: {response.status_code}")
                        print(f"Response: {response.text}")
                else:
                    print("❌ Daire 36 not found")
            else:
                print(f"❌ Failed to get apartments: {response.status_code}")
        else:
            print("❌ B Blok not found")
    else:
        print(f"❌ Failed to get blocks: {response.status_code}")
        
except Exception as e:
    print(f"❌ Request failed: {e}")

print("\n" + "=" * 80)
print("RESIDENTS ENDPOINT TEST COMPLETED")
print("=" * 80)