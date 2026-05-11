#!/usr/bin/env python3
"""
Debug JWT token to see what roles are included
"""

import requests
import base64
import json

BASE_URL = "http://192.168.70.211:8080/api"

def decode_jwt_payload(token):
    """Decode JWT payload (without verification)"""
    try:
        # JWT has 3 parts separated by dots
        parts = token.split('.')
        if len(parts) != 3:
            return None
            
        # Decode the payload (second part)
        payload = parts[1]
        
        # Add padding if needed
        padding = len(payload) % 4
        if padding:
            payload += '=' * (4 - padding)
            
        decoded = base64.urlsafe_b64decode(payload)
        return json.loads(decoded)
    except Exception as e:
        print(f"Error decoding JWT: {e}")
        return None

def debug_jwt():
    """Debug JWT token"""
    # Login
    login_data = {"email": "sakin@site.com", "password": "sakin123"}
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    
    if response.status_code == 200:
        data = response.json()
        token = data.get('accessToken')  # Changed from 'token' to 'accessToken'
        user = data.get('user')
        roles = data.get('roles')
        
        print(f"✅ Login successful")
        print(f"📍 User: {user.get('email')}")
        print(f"🔑 Roles: {roles}")
        
        # Decode JWT token
        if token:
            payload = decode_jwt_payload(token)
            if payload:
                print(f"\n🔍 JWT Payload:")
                for key, value in payload.items():
                    print(f"   {key}: {value}")
            else:
                print("❌ Could not decode JWT token")
        else:
            print("❌ No token received")
            
        # Test a simple endpoint that should work
        headers = {"Authorization": f"Bearer {token}"}
        
        # Try the profile endpoint
        profile_response = requests.get(f"{BASE_URL}/users/me", headers=headers)
        print(f"\n📊 Profile API status: {profile_response.status_code}")
        if profile_response.status_code != 200:
            print(f"Error: {profile_response.text}")
            
    else:
        print(f"❌ Login failed: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    debug_jwt()