#!/usr/bin/env python3
"""
Test the fixed residents endpoint with proper authentication
"""
import requests
import json

print("=" * 80)
print("TESTING FIXED RESIDENTS ENDPOINT WITH AUTH")
print("=" * 80)

# 1. Login as admin to get token
print("\n1. Logging in as admin...")
try:
    login_response = requests.post("http://localhost:8080/api/auth/login", 
                                 json={
                                     "email": "admin@site.com",
                                     "password": "admin123"
                                 })
    
    if login_response.status_code == 200:
        login_data = login_response.json()
        print(f"Login response: {login_data}")
        token = login_data.get('accessToken')
        if token:
            print(f"✅ Admin login successful, token: {token[:20]}...")
        else:
            print("❌ No token in response")
            exit(1)
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Test A Blok Daire 12 residents
        print("\n2. Testing A Blok Daire 12 residents...")
        
        # Get blocks
        response = requests.get("http://localhost:8080/api/sites/1/blocks", headers=headers)
        
        if response.status_code == 200:
            blocks = response.json()
            a_blok = next((b for b in blocks if b['name'] == 'A Blok'), None)
            
            if a_blok:
                print(f"✅ Found A Blok: {a_blok['id']}")
                
                # Get apartments in A Blok
                response = requests.get(f"http://localhost:8080/api/blocks/{a_blok['id']}/apartments", headers=headers)
                
                if response.status_code == 200:
                    apartments = response.json()
                    daire_12 = next((a for a in apartments if a['unitNumber'] == '12'), None)
                    
                    if daire_12:
                        print(f"✅ Found Daire 12: {daire_12['id']}")
                        
                        # Get residents in Daire 12
                        response = requests.get(f"http://localhost:8080/api/apartments/{daire_12['id']}/residents", headers=headers)
                        
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
                        print("Available apartments:", [a['unitNumber'] for a in apartments])
                else:
                    print(f"❌ Failed to get apartments: {response.status_code}")
            else:
                print("❌ A Blok not found")
                print("Available blocks:", [b['name'] for b in blocks])
        else:
            print(f"❌ Failed to get blocks: {response.status_code}")
            
        # 3. Test B Blok Daire 36 residents
        print("\n3. Testing B Blok Daire 36 residents...")
        
        # Get blocks again
        response = requests.get("http://localhost:8080/api/sites/1/blocks", headers=headers)
        
        if response.status_code == 200:
            blocks = response.json()
            b_blok = next((b for b in blocks if b['name'] == 'B Blok'), None)
            
            if b_blok:
                print(f"✅ Found B Blok: {b_blok['id']}")
                
                # Get apartments in B Blok
                response = requests.get(f"http://localhost:8080/api/blocks/{b_blok['id']}/apartments", headers=headers)
                
                if response.status_code == 200:
                    apartments = response.json()
                    daire_36 = next((a for a in apartments if a['unitNumber'] == '36'), None)
                    
                    if daire_36:
                        print(f"✅ Found Daire 36: {daire_36['id']}")
                        
                        # Get residents in Daire 36
                        response = requests.get(f"http://localhost:8080/api/apartments/{daire_36['id']}/residents", headers=headers)
                        
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
                        print("Available apartments:", [a['unitNumber'] for a in apartments])
                else:
                    print(f"❌ Failed to get apartments: {response.status_code}")
            else:
                print("❌ B Blok not found")
        else:
            print(f"❌ Failed to get blocks: {response.status_code}")
            
    else:
        print(f"❌ Admin login failed: {login_response.status_code}")
        print(f"Response: {login_response.text}")
        exit(1)
        
except Exception as e:
    print(f"❌ Request failed: {e}")

print("\n" + "=" * 80)
print("RESIDENTS ENDPOINT TEST COMPLETED")
print("=" * 80)