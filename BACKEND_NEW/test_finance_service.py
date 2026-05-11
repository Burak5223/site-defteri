#!/usr/bin/env python3
"""
Test Finance Service API endpoints
"""

import requests
import json

def test_finance_service():
    base_url = "http://192.168.70.211:8080"
    
    print("🔍 Testing Finance Service API...")
    
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
            token = login_result.get('accessToken')
            user_info = login_result.get('user', {})
            site_id = user_info.get('siteId', '1')
            
            print(f"✅ Login successful!")
            print(f"Site ID: {site_id}")
            
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            # 2. Test incomes endpoint
            print(f"\n2️⃣ Testing incomes API for site {site_id}...")
            incomes_url = f"{base_url}/api/sites/{site_id}/incomes"
            print(f"URL: {incomes_url}")
            
            incomes_response = requests.get(incomes_url, headers=headers)
            print(f"Incomes Status: {incomes_response.status_code}")
            
            if incomes_response.status_code == 200:
                incomes_data = incomes_response.json()
                print(f"✅ Incomes API Response: {len(incomes_data)} incomes found")
                
                total_income = sum(income.get('amount', 0) for income in incomes_data)
                print(f"Total Income: ₺{total_income:,.2f}")
                
                if incomes_data:
                    print("Sample income:")
                    print(json.dumps(incomes_data[0], indent=2, ensure_ascii=False))
            else:
                print(f"❌ Incomes API Error: {incomes_response.status_code}")
                print(f"Response: {incomes_response.text}")
            
            # 3. Test expenses endpoint
            print(f"\n3️⃣ Testing expenses API for site {site_id}...")
            expenses_url = f"{base_url}/api/sites/{site_id}/expenses"
            print(f"URL: {expenses_url}")
            
            expenses_response = requests.get(expenses_url, headers=headers)
            print(f"Expenses Status: {expenses_response.status_code}")
            
            if expenses_response.status_code == 200:
                expenses_data = expenses_response.json()
                print(f"✅ Expenses API Response: {len(expenses_data)} expenses found")
                
                total_expense = sum(expense.get('amount', 0) for expense in expenses_data)
                print(f"Total Expense: ₺{total_expense:,.2f}")
                
                if expenses_data:
                    print("Sample expense:")
                    print(json.dumps(expenses_data[0], indent=2, ensure_ascii=False))
            else:
                print(f"❌ Expenses API Error: {expenses_response.status_code}")
                print(f"Response: {expenses_response.text}")
                
        else:
            print(f"❌ Login failed: {login_response.status_code}")
            print(f"Response: {login_response.text}")
            
    except requests.exceptions.ConnectionError as e:
        print(f"❌ Connection Error: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_finance_service()