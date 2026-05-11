#!/usr/bin/env python3
"""
Test Resident Dashboard API in detail
"""

import requests
import json

def test_resident_dashboard_detailed():
    base_url = "http://192.168.70.211:8080"
    
    print("🔍 Testing Resident Dashboard API in Detail...")
    
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
            
            print(f"✅ Login successful!")
            print(f"User ID: {user_id}")
            print(f"Apartment ID: {user_info.get('apartmentId')}")
            
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            # Test /users/me/dashboard
            print(f"\n2️⃣ Testing /users/me/dashboard...")
            dashboard_response = requests.get(f"{base_url}/api/users/me/dashboard", headers=headers)
            print(f"Dashboard Status: {dashboard_response.status_code}")
            
            if dashboard_response.status_code == 200:
                dashboard_data = dashboard_response.json()
                print("✅ /users/me/dashboard Response:")
                print(json.dumps(dashboard_data, indent=2, ensure_ascii=False))
            else:
                print(f"❌ Dashboard API Error: {dashboard_response.status_code}")
                print(f"Response: {dashboard_response.text}")
            
            # Test /users/me/dues
            print(f"\n3️⃣ Testing /users/me/dues...")
            dues_response = requests.get(f"{base_url}/api/users/me/dues", headers=headers)
            print(f"My Dues Status: {dues_response.status_code}")
            
            if dues_response.status_code == 200:
                dues_data = dues_response.json()
                print(f"✅ /users/me/dues Response: {len(dues_data)} dues found")
                
                # Analyze due statuses
                status_counts = {}
                for due in dues_data:
                    status = due.get('status', 'unknown')
                    status_counts[status] = status_counts.get(status, 0) + 1
                
                print(f"Due Status Breakdown: {status_counts}")
                
                # Show all dues with details
                print("\n📋 All Dues Details:")
                for i, due in enumerate(dues_data, 1):
                    print(f"{i}. ID: {due.get('id')}")
                    print(f"   Status: {due.get('status')}")
                    print(f"   Amount: ₺{due.get('amount', 0)}")
                    print(f"   Period: {due.get('period')}")
                    print(f"   Description: {due.get('description')}")
                    print()
                
            else:
                print(f"❌ My Dues API Error: {dues_response.status_code}")
                print(f"Response: {dues_response.text}")
                
        else:
            print(f"❌ Login failed: {login_response.status_code}")
            print(f"Response: {login_response.text}")
            
    except requests.exceptions.ConnectionError as e:
        print(f"❌ Connection Error: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_resident_dashboard_detailed()