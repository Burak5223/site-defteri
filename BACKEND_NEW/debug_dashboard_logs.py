#!/usr/bin/env python3
"""
Debug Dashboard Logs
"""

import requests
import json

def debug_dashboard_logs():
    base_url = "http://192.168.70.211:8080"
    
    print("🔍 Debugging Dashboard Logs...")
    
    # Test with sakin user
    login_data = {
        "email": "sakin@site.com",
        "password": "sakin123"
    }
    
    try:
        login_response = requests.post(f"{base_url}/api/auth/login", json=login_data)
        
        if login_response.status_code == 200:
            login_result = login_response.json()
            token = login_result.get('accessToken')
            user_info = login_result.get('user', {})
            user_id = user_info.get('id')
            apartment_id = user_info.get('apartmentId')
            
            print(f"User ID: {user_id}")
            print(f"User Apartment ID: {apartment_id}")
            
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            # Call dashboard API to trigger logs
            print(f"\nCalling dashboard API to see logs...")
            dashboard_response = requests.get(f"{base_url}/api/users/me/dashboard", headers=headers)
            
            if dashboard_response.status_code == 200:
                dashboard_data = dashboard_response.json()
                print(f"Dashboard Response:")
                print(f"  Unpaid Dues: {dashboard_data.get('unpaidDues')}")
                print(f"  Unpaid Amount: {dashboard_data.get('unpaidAmount')}")
                print(f"  Waiting Packages: {dashboard_data.get('waitingPackages')}")
                print(f"  Open Tickets: {dashboard_data.get('openTickets')}")
            else:
                print(f"Dashboard API Error: {dashboard_response.status_code}")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_dashboard_logs()