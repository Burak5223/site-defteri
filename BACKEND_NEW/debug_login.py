#!/usr/bin/env python3
"""
Debug login response
"""

import requests
import json

BASE_URL = "http://192.168.70.211:8080/api"

def debug_login():
    """Debug login response"""
    # Login
    login_data = {"email": "sakin@site.com", "password": "sakin123"}
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    
    print(f"Login status: {response.status_code}")
    print(f"Login headers: {dict(response.headers)}")
    
    if response.status_code == 200:
        try:
            data = response.json()
            print(f"Login response keys: {list(data.keys())}")
            print(f"Full response: {json.dumps(data, indent=2)}")
        except Exception as e:
            print(f"Error parsing JSON: {e}")
            print(f"Raw response: {response.text}")
    else:
        print(f"Login failed: {response.text}")

if __name__ == "__main__":
    debug_login()