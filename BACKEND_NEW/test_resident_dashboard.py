#!/usr/bin/env python3
"""
Test Resident Dashboard API
Sakin kullanıcısı ile dashboard API'yi test eder
"""

import requests
import json

def test_resident_dashboard():
    """Sakin kullanıcısı ile dashboard API'yi test et"""
    
    base_url = "http://10.60.24.180:8080/api"
    
    # 1. Sakin kullanıcısı ile login ol
    login_url = f"{base_url}/auth/login"
    login_data = {
        "email": "sakin@site.com",
        "password": "123456"
    }
    
    print("🔐 Logging in as resident...")
    
    try:
        # Login yap
        login_response = requests.post(login_url, json=login_data, timeout=30)
        
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.status_code}")
            print(f"Response: {login_response.text}")
            return
            
        login_result = login_response.json()
        token = login_result.get('accessToken')
        user_info = login_result.get('user', {})
        
        if not token:
            print("❌ No access token received")
            return
            
        print("✅ Login successful")
        print(f"User ID: {user_info.get('id', 'N/A')}")
        print(f"User Name: {user_info.get('fullName', 'N/A')}")
        print(f"User Email: {user_info.get('email', 'N/A')}")
        
        # 2. Resident Dashboard API'yi test et
        dashboard_url = f"{base_url}/dashboard/resident"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        print(f"\n🔍 Testing Resident Dashboard API...")
        print(f"URL: {dashboard_url}")
        
        dashboard_response = requests.get(dashboard_url, headers=headers, timeout=30)
        
        print(f"Status Code: {dashboard_response.status_code}")
        
        if dashboard_response.status_code == 200:
            data = dashboard_response.json()
            print("\n✅ Resident Dashboard API Response:")
            print(json.dumps(data, indent=2, ensure_ascii=False))
            
            # Önemli alanları kontrol et
            print("\n📊 Key Statistics:")
            print(f"Unpaid Dues: {data.get('unpaidDues', 'N/A')}")
            print(f"Unpaid Amount: {data.get('unpaidAmount', 'N/A')}")
            print(f"Open Tickets: {data.get('openTickets', 'N/A')}")
            print(f"Waiting Packages: {data.get('waitingPackages', 'N/A')}")
            print(f"Unread Messages: {data.get('unreadMessages', 'N/A')}")
            
        else:
            print(f"❌ Dashboard API Error: {dashboard_response.status_code}")
            print(f"Response: {dashboard_response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_resident_dashboard()