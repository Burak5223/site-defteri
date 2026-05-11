#!/usr/bin/env python3
"""
Dashboard API Test with Authentication
Admin kullanıcısı ile login olup dashboard API'yi test eder
"""

import requests
import json

def login_and_test_dashboard():
    """Admin ile login ol ve dashboard API'yi test et"""
    
    base_url = "http://10.60.24.180:8080/api"
    
    # 1. Admin login
    login_url = f"{base_url}/auth/login"
    login_data = {
        "email": "admin@site.com",
        "password": "admin123"
    }
    
    print("🔐 Logging in as admin...")
    
    try:
        # Login yap
        login_response = requests.post(login_url, json=login_data, timeout=30)
        
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.status_code}")
            print(f"Response: {login_response.text}")
            return
            
        login_result = login_response.json()
        token = login_result.get('accessToken')
        
        if not token:
            print("❌ No access token received")
            return
            
        print("✅ Login successful")
        
        # 2. Dashboard API'yi test et
        dashboard_url = f"{base_url}/sites/1/dashboard"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        print(f"\n🔍 Testing Dashboard API...")
        print(f"URL: {dashboard_url}")
        
        dashboard_response = requests.get(dashboard_url, headers=headers, timeout=30)
        
        print(f"Status Code: {dashboard_response.status_code}")
        
        if dashboard_response.status_code == 200:
            data = dashboard_response.json()
            print("\n✅ Dashboard API Response:")
            print(json.dumps(data, indent=2, ensure_ascii=False))
            
            # Önemli alanları kontrol et
            print("\n📊 Key Statistics:")
            print(f"Unpaid Dues: {data.get('unpaidDues', 'N/A')}")
            print(f"Unpaid Amount: {data.get('unpaidAmount', 'N/A')}")
            print(f"Open Tickets: {data.get('openTickets', 'N/A')}")
            print(f"Total Apartments: {data.get('totalApartments', 'N/A')}")
            print(f"Monthly Income: {data.get('monthlyIncome', 'N/A')}")
            print(f"Monthly Expense: {data.get('monthlyExpense', 'N/A')}")
            print(f"Total Balance: {data.get('totalBalance', 'N/A')}")
            print(f"Active Announcements: {data.get('activeAnnouncements', 'N/A')}")
            print(f"Waiting Packages: {data.get('waitingPackages', 'N/A')}")
            
            # Eksik alanları kontrol et
            missing_fields = []
            expected_fields = [
                'unpaidDues', 'unpaidAmount', 'openTickets', 'totalApartments',
                'monthlyIncome', 'monthlyExpense', 'totalBalance', 
                'activeAnnouncements', 'waitingPackages'
            ]
            
            for field in expected_fields:
                if field not in data or data[field] is None:
                    missing_fields.append(field)
            
            if missing_fields:
                print(f"\n⚠️ Missing or null fields: {missing_fields}")
            else:
                print("\n✅ All expected fields are present")
                
        else:
            print(f"❌ Dashboard API Error: {dashboard_response.status_code}")
            print(f"Response: {dashboard_response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    login_and_test_dashboard()