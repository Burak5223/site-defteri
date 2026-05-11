#!/usr/bin/env python3
"""
Dashboard API Test - Localhost
"""

import requests
import json

def test_dashboard_api():
    base_url = "http://192.168.70.211:8080"  # Updated to correct IP
    
    print("🔍 Testing Dashboard API on 192.168.70.211...")
    
    # 1. Login to get token
    print("\n1️⃣ Logging in as admin...")
    login_data = {
        "email": "admin@site.com",
        "password": "admin123"
    }
    
    try:
        login_response = requests.post(f"{base_url}/api/auth/login", json=login_data)
        print(f"Login Status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            login_result = login_response.json()
            token = login_result.get('accessToken')  # Changed from 'token' to 'accessToken'
            user_info = login_result.get('user', {})
            site_id = user_info.get('siteId', '1')
            
            print(f"✅ Login successful!")
            print(f"User: {user_info.get('email')}")
            print(f"Site ID: {site_id}")
            print(f"Token: {token[:20]}..." if token else "No token")
            
            # 2. Test dashboard API
            print(f"\n2️⃣ Testing dashboard API for site {site_id}...")
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            dashboard_url = f"{base_url}/api/sites/{site_id}/dashboard"
            print(f"URL: {dashboard_url}")
            
            dashboard_response = requests.get(dashboard_url, headers=headers)
            print(f"Dashboard Status: {dashboard_response.status_code}")
            
            if dashboard_response.status_code == 200:
                dashboard_data = dashboard_response.json()
                print("✅ Dashboard API Response:")
                print(json.dumps(dashboard_data, indent=2, ensure_ascii=False))
                
                # Key metrics
                print(f"\n📊 Key Dashboard Metrics:")
                print(f"Unpaid Dues: {dashboard_data.get('unpaidDues', 0)}")
                print(f"Unpaid Amount: ₺{dashboard_data.get('unpaidAmount', 0)}")
                print(f"Open Tickets: {dashboard_data.get('openTickets', 0)}")
                print(f"Total Apartments: {dashboard_data.get('totalApartments', 0)}")
                print(f"Monthly Income: ₺{dashboard_data.get('monthlyIncome', 0)}")
                print(f"Monthly Expense: ₺{dashboard_data.get('monthlyExpense', 0)}")
                
            else:
                print(f"❌ Dashboard API Error: {dashboard_response.status_code}")
                print(f"Response: {dashboard_response.text}")
                
        else:
            print(f"❌ Login failed: {login_response.status_code}")
            print(f"Response: {login_response.text}")
            
    except requests.exceptions.ConnectionError as e:
        print(f"❌ Connection Error: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_dashboard_api()