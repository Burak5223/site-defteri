#!/usr/bin/env python3
"""
Test Resident Packages API
"""

import requests
import json

def test_resident_packages():
    base_url = "http://192.168.70.211:8080"
    
    print("🔍 Testing Resident Packages API...")
    
    # Test with sakin user
    print("\n1️⃣ Testing with sakin user...")
    login_data = {
        "email": "sakin@site.com",
        "password": "sakin123"
    }
    
    try:
        login_response = requests.post(f"{base_url}/api/auth/login", json=login_data)
        print(f"Login Status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            login_result = login_response.json()
            token = login_result.get('accessToken')
            user_info = login_result.get('user', {})
            user_id = user_info.get('id')
            apartment_id = user_info.get('apartmentId')
            
            print(f"✅ Login successful!")
            print(f"User ID: {user_id}")
            print(f"Apartment ID: {apartment_id}")
            
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            # Test dashboard API for packages
            print(f"\n2️⃣ Testing dashboard API for packages...")
            dashboard_response = requests.get(f"{base_url}/api/users/me/dashboard", headers=headers)
            print(f"Dashboard Status: {dashboard_response.status_code}")
            
            if dashboard_response.status_code == 200:
                dashboard_data = dashboard_response.json()
                waiting_packages = dashboard_data.get('waitingPackages', 0)
                print(f"Dashboard says: {waiting_packages} waiting packages")
            
            # Test packages by apartment
            print(f"\n3️⃣ Testing packages by apartment...")
            if apartment_id:
                packages_response = requests.get(f"{base_url}/api/apartments/{apartment_id}/packages", headers=headers)
                print(f"Packages by apartment Status: {packages_response.status_code}")
                
                if packages_response.status_code == 200:
                    packages_data = packages_response.json()
                    print(f"✅ Packages by apartment: {len(packages_data)} packages found")
                    
                    # Show package details
                    for i, package in enumerate(packages_data, 1):
                        print(f"{i}. Package ID: {package.get('id')}")
                        print(f"   Status: {package.get('status')}")
                        print(f"   Recipient: {package.get('recipientName')}")
                        print(f"   Sender: {package.get('senderName')}")
                        print(f"   Created: {package.get('createdAt')}")
                        print()
                else:
                    print(f"❌ Packages by apartment Error: {packages_response.status_code}")
                    print(f"Response: {packages_response.text}")
            
            # Test all packages for user
            print(f"\n4️⃣ Testing all packages...")
            all_packages_response = requests.get(f"{base_url}/api/packages", headers=headers)
            print(f"All packages Status: {all_packages_response.status_code}")
            
            if all_packages_response.status_code == 200:
                all_packages_data = all_packages_response.json()
                print(f"✅ All packages: {len(all_packages_data)} packages found")
                
                # Filter by apartment
                apartment_packages = [p for p in all_packages_data if p.get('apartmentId') == apartment_id]
                print(f"Packages for apartment {apartment_id}: {len(apartment_packages)}")
                
                # Filter by status
                waiting_packages_list = [p for p in apartment_packages if p.get('status') in ['beklemede', 'waiting', 'teslim_bekliyor', 'waiting_confirmation']]
                print(f"Waiting packages: {len(waiting_packages_list)}")
                
                if waiting_packages_list:
                    print("Waiting packages details:")
                    for i, package in enumerate(waiting_packages_list, 1):
                        print(f"{i}. Package ID: {package.get('id')}")
                        print(f"   Status: {package.get('status')}")
                        print(f"   Recipient: {package.get('recipientName')}")
                        print(f"   Apartment ID: {package.get('apartmentId')}")
                        print()
                
            else:
                print(f"❌ All packages Error: {all_packages_response.status_code}")
                print(f"Response: {all_packages_response.text}")
                
        else:
            print(f"❌ Login failed: {login_response.status_code}")
            print(f"Response: {login_response.text}")
            
    except requests.exceptions.ConnectionError as e:
        print(f"❌ Connection Error: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_resident_packages()