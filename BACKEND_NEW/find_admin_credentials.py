#!/usr/bin/env python3

import requests
import json

def find_admin_credentials():
    base_url = "http://localhost:8080/api"
    
    print("=== ADMIN KULLANICI ARAMA ===")
    
    # Common admin credentials to try
    admin_credentials = [
        {"email": "admin@yesilvadi.com", "password": "admin123"},
        {"email": "admin@site.com", "password": "admin123"},
        {"email": "admin@example.com", "password": "admin123"},
        {"email": "admin@localhost", "password": "admin123"},
        {"email": "admin@yesilvadi.com", "password": "123456"},
        {"email": "admin@yesilvadi.com", "password": "password"},
        {"email": "yonetici@yesilvadi.com", "password": "admin123"},
        {"email": "test@admin.com", "password": "admin123"},
    ]
    
    for i, creds in enumerate(admin_credentials, 1):
        print(f"\n{i}. Trying: {creds['email']} / {creds['password']}")
        
        try:
            response = requests.post(f"{base_url}/auth/login", json=creds)
            print(f"   Response: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"   ✓ SUCCESS! Token: {result.get('token', 'No token')[:50]}...")
                print(f"   User: {result.get('user', {})}")
                return creds, result.get('token')
            else:
                print(f"   ✗ Failed: {response.text}")
                
        except Exception as e:
            print(f"   ✗ Exception: {e}")
    
    print("\n❌ No working admin credentials found!")
    print("\nTrying to create a new admin user...")
    
    # Try to create admin user using existing script
    try:
        import subprocess
        result = subprocess.run(['python', 'create_admin_user.py'], 
                              capture_output=True, text=True, cwd='.')
        print(f"Create admin result: {result.stdout}")
        if result.stderr:
            print(f"Create admin error: {result.stderr}")
            
        # Try the default credentials again
        default_creds = {"email": "admin@yesilvadi.com", "password": "admin123"}
        response = requests.post(f"{base_url}/auth/login", json=default_creds)
        if response.status_code == 200:
            result = response.json()
            print("✓ Admin user created and login successful!")
            return default_creds, result.get('token')
            
    except Exception as e:
        print(f"Error creating admin: {e}")
    
    return None, None

if __name__ == "__main__":
    creds, token = find_admin_credentials()
    if token:
        print(f"\n🎉 Working credentials found: {creds['email']} / {creds['password']}")
        print(f"Token: {token[:50]}...")
    else:
        print("\n❌ Could not find or create working admin credentials")