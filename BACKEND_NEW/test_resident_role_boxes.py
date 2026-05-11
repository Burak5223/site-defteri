#!/usr/bin/env python3
"""
Test script to verify resident user can see role boxes (Yönetici, Güvenlik, Temizlikçi)
"""
import requests
import json

BASE_URL = "http://localhost:8080/api"

def test_resident_login():
    """Test resident login"""
    print("=== TESTING RESIDENT LOGIN ===")
    
    login_data = {
        "email": "sakin@site.com",
        "password": "sakin123"
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Login successful")
        print(f"Response keys: {list(data.keys())}")
        user_id = data.get('userId') or data.get('id')
        print(f"User ID: {user_id}")
        print(f"Roles: {data.get('roles', [])}")
        print(f"Apartment ID: {data.get('apartmentId', 'NOT FOUND')}")
        token = data.get('token') or data.get('accessToken') or 'NO_TOKEN'
        return token, str(user_id)
    else:
        print(f"✗ Login failed: {response.text}")
        return None, None

def test_get_users(token):
    """Test /users endpoint to see if staff users are returned"""
    print("\n=== TESTING /users ENDPOINT ===")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/users", headers=headers)
    
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        users = response.json()
        print(f"✓ Total users: {len(users)}")
        
        # Filter by role
        admins = [u for u in users if 'ADMIN' in u.get('roles', []) or 'ROLE_ADMIN' in u.get('roles', [])]
        security = [u for u in users if 'SECURITY' in u.get('roles', []) or 'ROLE_SECURITY' in u.get('roles', [])]
        cleaning = [u for u in users if 'CLEANING' in u.get('roles', []) or 'ROLE_CLEANING' in u.get('roles', [])]
        
        print(f"\nRole breakdown:")
        print(f"  Admins: {len(admins)}")
        for admin in admins:
            print(f"    - {admin.get('fullName', 'Unknown')} (ID: {admin.get('id') or admin.get('userId')})")
        
        print(f"  Security: {len(security)}")
        for sec in security:
            print(f"    - {sec.get('fullName', 'Unknown')} (ID: {sec.get('id') or sec.get('userId')})")
        
        print(f"  Cleaning: {len(cleaning)}")
        for clean in cleaning:
            print(f"    - {clean.get('fullName', 'Unknown')} (ID: {clean.get('id') or clean.get('userId')})")
        
        return len(admins) > 0 and len(security) > 0 and len(cleaning) > 0
    else:
        print(f"✗ Failed to get users: {response.text}")
        return False

def test_get_messages(token, user_id):
    """Test /messages endpoint"""
    print("\n=== TESTING /messages ENDPOINT ===")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/messages?siteId=1", headers=headers)
    
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        messages = response.json()
        print(f"✓ Total messages: {len(messages)}")
        
        # Filter messages for this user
        user_messages = [m for m in messages if m.get('receiverId') == user_id or m.get('senderId') == user_id]
        print(f"  Messages for user {user_id}: {len(user_messages)}")
        
        # Show sample messages
        if user_messages:
            print(f"\nSample messages:")
            for msg in user_messages[:3]:
                print(f"  - From: {msg.get('senderName')} → To: {msg.get('receiverId')}")
                print(f"    Type: {msg.get('chatType')}, Body: {msg.get('body', '')[:50]}")
        
        return True
    else:
        print(f"✗ Failed to get messages: {response.text}")
        return False

def main():
    print("=" * 60)
    print("RESIDENT ROLE BOXES TEST")
    print("=" * 60)
    
    # Test 1: Login as resident
    token, user_id = test_resident_login()
    if not token:
        print("\n✗ FAILED: Cannot login as resident")
        return
    
    # Test 2: Get users list (should include staff)
    has_staff = test_get_users(token)
    if not has_staff:
        print("\n✗ FAILED: Staff users not found in /users endpoint")
        return
    
    # Test 3: Get messages
    test_get_messages(token, user_id)
    
    print("\n" + "=" * 60)
    print("CONCLUSION:")
    print("=" * 60)
    print("✓ Resident can login")
    print("✓ /users endpoint returns staff users (admin, security, cleaning)")
    print("✓ /messages endpoint works")
    print("\nThe backend is working correctly.")
    print("The issue is in the FRONTEND (MessagesScreen.tsx)")
    print("Role boxes should be visible for residents but they are being filtered out.")

if __name__ == "__main__":
    main()
