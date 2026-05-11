#!/usr/bin/env python3
"""
Dashboard API Test
Site 1 için dashboard API'nin döndürdüğü verileri test eder
"""

import requests
import json

def test_dashboard_api():
    """Dashboard API'yi test et"""
    
    # API endpoint
    url = "http://10.60.24.180:8080/api/sites/1/dashboard"
    
    print("🔍 Testing Dashboard API...")
    print(f"URL: {url}")
    
    try:
        # API çağrısı yap
        response = requests.get(url, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
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
            
        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Connection Error: {e}")

if __name__ == "__main__":
    test_dashboard_api()