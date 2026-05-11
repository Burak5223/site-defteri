#!/usr/bin/env python3
"""
Test script to verify package count consistency between dashboard and packages screen
"""

import requests
import json

# Configuration
BASE_URL = "http://192.168.70.211:8080/api"
SAKIN_EMAIL = "sakin@site.com"
SAKIN_PASSWORD = "sakin123"

def login_as_sakin():
    """Login as sakin user and get token"""
    login_data = {
        "email": SAKIN_EMAIL,
        "password": SAKIN_PASSWORD
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if response.status_code == 200:
        data = response.json()
        return data.get('token'), data.get('user')
    else:
        print(f"❌ Login failed: {response.status_code}")
        print(response.text)
        return None, None

def test_package_consistency():
    """Test package count consistency between dashboard and packages APIs"""
    print("🔍 Testing package count consistency...")
    
    # Login as sakin
    token, user = login_as_sakin()
    if not token:
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    apartment_id = user.get('apartmentId')
    
    print(f"✅ Logged in as: {user.get('email')}")
    print(f"📍 Apartment ID: {apartment_id}")
    
    # Test 1: Get dashboard data
    print("\n📊 Testing dashboard API...")
    dashboard_response = requests.get(f"{BASE_URL}/users/me/dashboard", headers=headers)
    
    if dashboard_response.status_code == 200:
        dashboard_data = dashboard_response.json()
        dashboard_packages = dashboard_data.get('waitingPackages', 0)
        print(f"✅ Dashboard API - Waiting packages: {dashboard_packages}")
    else:
        print(f"❌ Dashboard API failed: {dashboard_response.status_code}")
        print(dashboard_response.text)
        return
    
    # Test 2: Get packages by apartment (same as ResidentPackages screen)
    print("\n📦 Testing packages by apartment API...")
    packages_response = requests.get(f"{BASE_URL}/apartments/{apartment_id}/packages", headers=headers)
    
    if packages_response.status_code == 200:
        packages_data = packages_response.json()
        
        # Count waiting packages (same logic as ResidentPackages screen)
        waiting_packages = 0
        for pkg in packages_data:
            status = pkg.get('status', '').lower()
            if status in ['beklemede', 'waiting', 'teslim_bekliyor', 'waiting_confirmation']:
                waiting_packages += 1
        
        print(f"✅ Packages API - Total packages: {len(packages_data)}")
        print(f"✅ Packages API - Waiting packages: {waiting_packages}")
        
        # Show package details
        if packages_data:
            print("\n📋 Package details:")
            for i, pkg in enumerate(packages_data, 1):
                print(f"  {i}. Status: {pkg.get('status')} | Tracking: {pkg.get('trackingNumber', 'N/A')} | Company: {pkg.get('courierCompany', 'N/A')}")
        else:
            print("📋 No packages found for this apartment")
            
    else:
        print(f"❌ Packages API failed: {packages_response.status_code}")
        print(packages_response.text)
        return
    
    # Test 3: Compare results
    print(f"\n🔍 Consistency Check:")
    print(f"Dashboard waiting packages: {dashboard_packages}")
    print(f"Packages screen waiting packages: {waiting_packages}")
    
    if dashboard_packages == waiting_packages:
        print("✅ SUCCESS: Package counts are consistent!")
    else:
        print("❌ INCONSISTENCY: Package counts don't match!")
        print("This means the dashboard and packages screen are using different logic")
    
    return dashboard_packages == waiting_packages

if __name__ == "__main__":
    test_package_consistency()