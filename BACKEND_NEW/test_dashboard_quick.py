#!/usr/bin/env python3
"""
Quick test for Super Admin Dashboard
"""
import requests
import json

BASE_URL = "http://localhost:8080/api"

print("=== Testing Super Admin Dashboard ===\n")

# Check if backend is running
try:
    health_check = requests.get(f"{BASE_URL}/auth/login", timeout=2)
    print("✓ Backend is running\n")
except:
    print("❌ Backend is not running! Please start it first.")
    exit(1)

# Step 1: Login as super admin
print("1. Logging in as super admin...")
try:
    login_response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "superadmin@site.com",
        "password": "super123"
    }, timeout=5)
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(login_response.text)
        exit(1)
    
    response_data = login_response.json()
    print(f"Login response: {response_data}")
    token = response_data.get('token') or response_data.get('accessToken')
    if not token:
        print(f"❌ No token in response!")
        exit(1)
    print(f"✓ Logged in successfully\n")
except Exception as e:
    print(f"❌ Login error: {e}")
    exit(1)

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Step 2: Get dashboard stats
print("2. Getting dashboard stats...")
try:
    stats_response = requests.get(f"{BASE_URL}/super-admin/dashboard", headers=headers, timeout=10)
    
    if stats_response.status_code != 200:
        print(f"❌ Failed to get stats: {stats_response.status_code}")
        print(stats_response.text)
        exit(1)
    
    stats = stats_response.json()
    print(f"✓ Dashboard stats retrieved\n")
except Exception as e:
    print(f"❌ Stats error: {e}")
    exit(1)

# Display stats
print("=" * 60)
print("DASHBOARD STATISTICS")
print("=" * 60)
print(f"Total Sites:          {stats.get('totalSites', 0)}")
print(f"Total Managers:       {stats.get('totalManagers', 0)}")
print(f"Total Residents:      {stats.get('totalResidents', 0)}")
print(f"Total Apartments:     {stats.get('totalApartments', 0)}")
print(f"Performance Score:    {stats.get('performanceScore', 0)}")
print(f"Monthly Income:       ₺{stats.get('monthlyIncome', 0):,.2f}")
print(f"Open Tickets:         {stats.get('openTickets', 0)}")
print(f"Unpaid Dues:          {stats.get('unpaidDues', 0)}")
print(f"Waiting Packages:     {stats.get('waitingPackages', 0)}")

# Verification
print(f"\n{'='*60}")
print("VERIFICATION")
print(f"{'='*60}")

success = True

if stats.get('totalResidents', 0) == 0:
    print("❌ Total Residents is 0 - FAILED")
    success = False
else:
    print(f"✓ Total Residents: {stats.get('totalResidents', 0)}")

if stats.get('monthlyIncome', 0) == 0:
    print("❌ Monthly Income is 0 - FAILED")
    success = False
else:
    print(f"✓ Monthly Income: ₺{stats.get('monthlyIncome', 0):,.2f}")

if success:
    print(f"\n✓ ALL TESTS PASSED!")
else:
    print(f"\n❌ SOME TESTS FAILED!")
