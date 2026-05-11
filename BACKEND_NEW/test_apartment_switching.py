#!/usr/bin/env python3
"""
Test apartment switching feature
"""
import requests
import json

BASE_URL = "http://localhost:8080/api"

# Test kullanıcısı (admin@site.com)
def login():
    """Login and get token"""
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "admin@site.com",
        "password": "123456"
    })
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Login successful")
        print(f"   User: {data['user']['fullName']}")
        print(f"   Roles: {data['roles']}")
        return data['accessToken']
    else:
        print(f"❌ Login failed: {response.status_code}")
        print(response.text)
        return None

def get_user_apartments(token):
    """Get all apartments for the user"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/users/me/apartments", headers=headers)
    
    if response.status_code == 200:
        apartments = response.json()
        print(f"\n✅ User has {len(apartments)} apartment(s):")
        for apt in apartments:
            print(f"   - {apt['blockName']} - {apt['unitNumber']} ({apt['assignmentType']})")
            print(f"     ID: {apt['id']}")
        return apartments
    else:
        print(f"\n❌ Failed to get apartments: {response.status_code}")
        print(response.text)
        return []

def switch_apartment(token, apartment_id):
    """Switch to a different apartment"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(
        f"{BASE_URL}/users/me/switch-apartment",
        headers=headers,
        json={"apartmentId": apartment_id}
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n✅ Successfully switched apartment")
        print(f"   New apartment ID: {data.get('apartmentId', 'N/A')}")
        return True
    else:
        print(f"\n❌ Failed to switch apartment: {response.status_code}")
        print(response.text)
        return False

def main():
    print("=" * 60)
    print("APARTMENT SWITCHING TEST")
    print("=" * 60)
    
    # 1. Login
    print("\n1. Logging in...")
    token = login()
    if not token:
        return
    
    # 2. Get user's apartments
    print("\n2. Getting user's apartments...")
    apartments = get_user_apartments(token)
    
    if len(apartments) == 0:
        print("\n⚠️  User has no apartments in residency_history")
        print("   This is expected if the user only has one apartment")
        print("   and it's not in the residency_history table yet.")
    elif len(apartments) == 1:
        print("\n⚠️  User has only 1 apartment")
        print("   Cannot test switching (need at least 2 apartments)")
    else:
        # 3. Try switching to another apartment
        print("\n3. Testing apartment switch...")
        target_apartment = apartments[1]  # Switch to second apartment
        print(f"   Switching to: {target_apartment['blockName']} - {target_apartment['unitNumber']}")
        switch_apartment(token, target_apartment['id'])
        
        # 4. Verify the switch
        print("\n4. Verifying the switch...")
        get_user_apartments(token)
    
    print("\n" + "=" * 60)
    print("TEST COMPLETED")
    print("=" * 60)

if __name__ == "__main__":
    main()
