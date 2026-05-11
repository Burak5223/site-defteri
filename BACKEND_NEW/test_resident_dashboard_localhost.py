#!/usr/bin/env python3
"""
Resident Dashboard API Test - Localhost
"""

import requests
import json

def test_resident_dashboard_api():
    base_url = "http://localhost:8080"
    
    print("🔍 Testing Resident Dashboard API on localhost...")
    
    # 1. Login as resident (sakin)
    print("\n1️⃣ Logging in as resident...")
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
            print(f"User: {user_info.get('email')}")
            print(f"User ID: {user_id}")
            print(f"Token: {token[:20]}..." if token else "No token")
            
            # 2. Test resident dashboard API
            print(f"\n2️⃣ Testing resident dashboard API for site 1...")
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            dashboard_url = f"{base_url}/api/sites/1/dashboard/resident"
            print(f"URL: {dashboard_url}")
            
            dashboard_response = requests.get(dashboard_url, headers=headers)
            print(f"Dashboard Status: {dashboard_response.status_code}")
            
            if dashboard_response.status_code == 200:
                dashboard_data = dashboard_response.json()
                print("✅ Resident Dashboard API Response:")
                print(json.dumps(dashboard_data, indent=2, ensure_ascii=False))
                
                # Key metrics
                print(f"\n📊 Resident Dashboard Metrics:")
                print(f"Unpaid Dues: {dashboard_data.get('unpaidDues', 0)}")
                print(f"Unpaid Amount: ₺{dashboard_data.get('unpaidAmount', 0)}")
                print(f"Open Tickets: {dashboard_data.get('openTickets', 0)}")
                print(f"Waiting Packages: {dashboard_data.get('waitingPackages', 0)}")
                print(f"Unread Messages: {dashboard_data.get('unreadMessages', 0)}")
                
            else:
                print(f"❌ Resident Dashboard API Error: {dashboard_response.status_code}")
                print(f"Response: {dashboard_response.text}")
                
        else:
            print(f"❌ Login failed: {login_response.status_code}")
            print(f"Response: {login_response.text}")
            
    except requests.exceptions.ConnectionError as e:
        print(f"❌ Connection Error: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_resident_dashboard_api()