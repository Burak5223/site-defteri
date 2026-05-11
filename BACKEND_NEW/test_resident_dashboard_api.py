#!/usr/bin/env python3
"""
Test Resident Dashboard API
"""

import requests
import json

def test_resident_dashboard():
    base_url = "http://192.168.70.211:8080"
    
    print("🔍 Testing Resident Dashboard API...")
    
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
            print(f"User Info: {json.dumps(user_info, indent=2, ensure_ascii=False)}")
            
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            # 2. Test resident dashboard API
            print(f"\n2️⃣ Testing resident dashboard API...")
            dashboard_url = f"{base_url}/api/users/{user_id}/dashboard"
            print(f"URL: {dashboard_url}")
            
            dashboard_response = requests.get(dashboard_url, headers=headers)
            print(f"Dashboard Status: {dashboard_response.status_code}")
            
            if dashboard_response.status_code == 200:
                dashboard_data = dashboard_response.json()
                print("✅ Resident Dashboard API Response:")
                print(json.dumps(dashboard_data, indent=2, ensure_ascii=False))
                
                # Key metrics
                print(f"\n📊 Key Resident Dashboard Metrics:")
                print(f"Unpaid Dues: {dashboard_data.get('unpaidDues', 0)}")
                print(f"Unpaid Amount: ₺{dashboard_data.get('unpaidAmount', 0)}")
                print(f"Open Tickets: {dashboard_data.get('openTickets', 0)}")
                print(f"Waiting Packages: {dashboard_data.get('waitingPackages', 0)}")
                
            else:
                print(f"❌ Dashboard API Error: {dashboard_response.status_code}")
                print(f"Response: {dashboard_response.text}")
            
            # 3. Test my dues API
            print(f"\n3️⃣ Testing my dues API...")
            dues_url = f"{base_url}/api/users/{user_id}/dues"
            print(f"URL: {dues_url}")
            
            dues_response = requests.get(dues_url, headers=headers)
            print(f"My Dues Status: {dues_response.status_code}")
            
            if dues_response.status_code == 200:
                dues_data = dues_response.json()
                print(f"✅ My Dues API Response: {len(dues_data)} dues found")
                
                pending_dues = [d for d in dues_data if d.get('status') in ['bekliyor', 'pending']]
                print(f"Pending Dues: {len(pending_dues)}")
                
                if pending_dues:
                    total_amount = sum(d.get('amount', 0) for d in pending_dues)
                    print(f"Total Pending Amount: ₺{total_amount}")
                    print("Sample pending due:")
                    print(json.dumps(pending_dues[0], indent=2, ensure_ascii=False))
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
    test_resident_dashboard()