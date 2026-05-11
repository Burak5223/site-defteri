#!/usr/bin/env python3

import requests
import json

def test_dashboard_api_with_auth():
    """Test the dashboard API endpoint with authentication"""
    
    base_url = "http://localhost:8080"
    
    # First login to get JWT token
    login_url = f"{base_url}/api/auth/login"
    login_data = {
        "email": "admin@site.com",
        "password": "admin123"
    }
    
    print(f"🔐 Logging in as admin...")
    
    try:
        # Login
        login_response = requests.post(login_url, json=login_data)
        print(f"Login Status: {login_response.status_code}")
        
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.text}")
            return
            
        login_result = login_response.json()
        token = login_result.get('accessToken')
        
        if not token:
            print(f"❌ No token in login response: {login_result}")
            return
            
        print(f"✅ Login successful, got token")
        
        # Test dashboard API with token
        site_id = "1"
        dashboard_url = f"{base_url}/api/sites/{site_id}/dashboard"
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        print(f"🔍 Testing dashboard API: {dashboard_url}")
        
        response = requests.get(dashboard_url, headers=headers)
        print(f"📊 Dashboard Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Dashboard API Response:")
            print(json.dumps(data, indent=2, ensure_ascii=False))
            
            # Check pending dues specifically
            if 'unpaidDues' in data:
                print(f"\n🎯 Pending Dues Analysis:")
                print(f"   - Unpaid Dues Count: {data.get('unpaidDues', 0)}")
                print(f"   - Unpaid Amount: ₺{data.get('unpaidAmount', 0):,}")
                print(f"   - Total Dues: {data.get('totalDues', 0)}")
                print(f"   - Paid Dues: {data.get('paidDues', 0)}")
                print(f"   - Collection Rate: {data.get('collectionRate', 0)}%")
                
                if data.get('unpaidDues', 0) > 0:
                    print(f"✅ SUCCESS: Dashboard shows {data['unpaidDues']} pending dues worth ₺{data['unpaidAmount']:,}")
                else:
                    print(f"❌ ISSUE: Dashboard still shows 0 pending dues")
            else:
                print(f"❌ ERROR: Dashboard response missing unpaidDues field")
                
        else:
            print(f"❌ Dashboard API Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        print("Make sure backend is running on localhost:8080")

if __name__ == "__main__":
    test_dashboard_api_with_auth()