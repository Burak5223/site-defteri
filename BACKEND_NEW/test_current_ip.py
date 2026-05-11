#!/usr/bin/env python3
"""
Test current IP connectivity
"""

import requests

# Current IP from ipconfig
CURRENT_IP = "10.50.19.185"
BASE_URL = f"http://{CURRENT_IP}:8080/api"

def test_connectivity():
    """Test if backend is accessible on current IP"""
    print(f"🔍 Testing backend connectivity on: {CURRENT_IP}")
    
    try:
        # Test health endpoint
        response = requests.get(f"{BASE_URL}/test/health", timeout=5)
        print(f"✅ Health check: {response.status_code}")
        
        # Test login
        login_data = {"email": "sakin@site.com", "password": "sakin123"}
        login_response = requests.post(f"{BASE_URL}/auth/login", json=login_data, timeout=10)
        print(f"✅ Login test: {login_response.status_code}")
        
        if login_response.status_code == 200:
            data = login_response.json()
            token = data.get('accessToken')
            print(f"✅ Authentication successful")
            
            # Test dashboard
            headers = {"Authorization": f"Bearer {token}"}
            dashboard_response = requests.get(f"{BASE_URL}/users/me/dashboard", headers=headers, timeout=10)
            print(f"✅ Dashboard test: {dashboard_response.status_code}")
            
            if dashboard_response.status_code == 200:
                dashboard_data = dashboard_response.json()
                print(f"✅ Dashboard data: {dashboard_data.get('waitingPackages', 0)} waiting packages")
                print(f"🎉 SUCCESS: Backend is fully accessible on {CURRENT_IP}")
            else:
                print(f"❌ Dashboard failed: {dashboard_response.text}")
        else:
            print(f"❌ Login failed: {login_response.text}")
            
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print(f"💡 Backend may not be accessible on {CURRENT_IP}")
        print(f"💡 Try restarting backend or check firewall settings")

if __name__ == "__main__":
    test_connectivity()