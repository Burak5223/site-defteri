#!/usr/bin/env python3
"""
Verify all counts are consistent across the system
"""

import mysql.connector
import requests

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)
cursor = conn.cursor(dictionary=True)

print("=" * 80)
print("VERIFYING ALL COUNTS")
print("=" * 80)
print()

# 1. Database counts
print("1. DATABASE COUNTS:")
print("-" * 80)

# Total residents
cursor.execute("""
    SELECT COUNT(DISTINCT u.id) as total
    FROM users u
    JOIN user_site_memberships usm ON u.id = usm.user_id
    JOIN residency_history rh ON u.id = rh.user_id
    JOIN apartments a ON rh.apartment_id = a.id
    WHERE usm.site_id = '1'
    AND usm.role_type = 'sakin'
    AND rh.status = 'active'
    AND a.site_id = '1'
""")
db_total = cursor.fetchone()['total']
print(f"  Total Residents: {db_total}")

# Owner/Tenant split
cursor.execute("""
    SELECT 
        SUM(CASE WHEN is_owner = 1 THEN 1 ELSE 0 END) as owners,
        SUM(CASE WHEN is_owner = 0 THEN 1 ELSE 0 END) as tenants
    FROM residency_history rh
    JOIN apartments a ON rh.apartment_id = a.id
    WHERE rh.status = 'active'
    AND a.site_id = '1'
""")
split = cursor.fetchone()
print(f"  Owners: {split['owners']}")
print(f"  Tenants: {split['tenants']}")

# By block
cursor.execute("""
    SELECT 
        a.block_name,
        COUNT(DISTINCT u.id) as count
    FROM users u
    JOIN residency_history rh ON u.id = rh.user_id
    JOIN apartments a ON rh.apartment_id = a.id
    WHERE rh.status = 'active'
    AND a.site_id = '1'
    GROUP BY a.block_name
    ORDER BY a.block_name
""")
blocks = cursor.fetchall()
print(f"\n  By Block:")
for block in blocks:
    print(f"    {block['block_name']}: {block['count']}")
print()

# 2. API Endpoint counts
print("2. API ENDPOINT COUNTS:")
print("-" * 80)

# Login as admin
login_data = {
    "email": "testusertwo371073@test.com",
    "password": "admin123"
}

try:
    response = requests.post("http://localhost:8080/api/auth/login", json=login_data)
    if response.status_code == 200:
        token = response.json().get('accessToken')
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get users
        response = requests.get("http://localhost:8080/api/users", headers=headers)
        if response.status_code == 200:
            users = response.json()
            print(f"  /api/users: {len(users)} users")
            
            # Count with apartments
            with_apartments = [u for u in users if u.get('blockName') and u.get('unitNumber')]
            print(f"  With apartments: {len(with_apartments)}")
            
            # Count by type
            owners = [u for u in with_apartments if u.get('residentType') == 'owner']
            tenants = [u for u in with_apartments if u.get('residentType') == 'tenant']
            print(f"  Owners: {len(owners)}")
            print(f"  Tenants: {len(tenants)}")
            
            # By block
            block_counts = {}
            for user in with_apartments:
                block = user.get('blockName', 'Unknown')
                block_counts[block] = block_counts.get(block, 0) + 1
            
            print(f"\n  By Block:")
            for block, count in sorted(block_counts.items()):
                print(f"    {block}: {count}")
        else:
            print(f"  ✗ /api/users failed: {response.status_code}")
    else:
        print(f"  ✗ Login failed: {response.status_code}")
except Exception as e:
    print(f"  ✗ API Error: {e}")

print()

# 3. Messaging endpoint
print("3. MESSAGING ENDPOINT:")
print("-" * 80)
try:
    if 'token' in locals():
        response = requests.get("http://localhost:8080/api/messages/apartments-for-messaging", headers=headers)
        if response.status_code == 200:
            apartments = response.json()
            print(f"  /api/messages/apartments-for-messaging: {len(apartments)} apartments")
            
            # Count unique residents
            resident_ids = set()
            for apt in apartments:
                if apt.get('currentResidentId'):
                    resident_ids.add(apt['currentResidentId'])
                if apt.get('ownerUserId'):
                    resident_ids.add(apt['ownerUserId'])
            
            print(f"  Unique residents in messaging: {len(resident_ids)}")
        else:
            print(f"  ✗ Messaging endpoint failed: {response.status_code}")
except Exception as e:
    print(f"  ✗ API Error: {e}")

print()

cursor.close()
conn.close()

print("=" * 80)
print("SUMMARY:")
print("=" * 80)
print("All counts should be:")
print("  - Total: 97 residents")
print("  - Owners: 48")
print("  - Tenants: 49")
print("  - A Blok: 33")
print("  - B Blok: 33")
print("  - C Blok: 31")
print("=" * 80)
