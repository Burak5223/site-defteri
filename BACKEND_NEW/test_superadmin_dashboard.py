#!/usr/bin/env python3
"""
Test Super Admin Dashboard Stats
"""
import requests
import json
import time

# Wait for backend to start
print("Waiting for backend to start...")
time.sleep(30)

BASE_URL = "http://localhost:8080/api"

print("=== Testing Super Admin Dashboard ===\n")

# Step 1: Login as super admin
print("1. Logging in as super admin...")
login_response = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "superadmin@site.com",
    "password": "super123"
})

if login_response.status_code != 200:
    print(f"❌ Login failed: {login_response.status_code}")
    print(login_response.text)
    exit(1)

token = login_response.json()['token']
print(f"✓ Logged in successfully")

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Step 2: Get dashboard stats
print("\n2. Getting dashboard stats...")
stats_response = requests.get(f"{BASE_URL}/super-admin/dashboard/stats", headers=headers)

if stats_response.status_code != 200:
    print(f"❌ Failed to get stats: {stats_response.status_code}")
    print(stats_response.text)
    exit(1)

stats = stats_response.json()
print(f"✓ Dashboard stats retrieved\n")

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

# Step 3: Get finance data
print(f"\n3. Getting finance data...")
finance_response = requests.get(f"{BASE_URL}/super-admin/finance?period=all", headers=headers)

if finance_response.status_code != 200:
    print(f"❌ Failed to get finance data: {finance_response.status_code}")
    print(finance_response.text)
else:
    finance = finance_response.json()
    print(f"✓ Finance data retrieved\n")
    
    print("=" * 60)
    print("FINANCE DATA")
    print("=" * 60)
    print(f"Total Commission:     ₺{finance.get('totalCommissionIncome', 0):,.2f}")
    print(f"Monthly Commission:   ₺{finance.get('monthlyCommissionIncome', 0):,.2f}")
    print(f"Monthly Growth:       {finance.get('monthlyGrowth', 0):.2f}%")
    print(f"Commission Rate:      {finance.get('commissionRate', 0)}%")

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

print(f"\n✓ Test complete!")
