import requests
import json

BASE_URL = "http://localhost:8080/api"

# Test users - all in Site 1
users = [
    {"email": "admin@site.com", "password": "admin123", "role": "ADMIN"},
    {"email": "sakin@site.com", "password": "sakin123", "role": "RESIDENT"},
    {"email": "security@site.com", "password": "security123", "role": "SECURITY"},
    {"email": "cleaning@site.com", "password": "cleaning123", "role": "CLEANING"}
]

print("=" * 80)
print("TESTING ALL ROLES - TICKET VISIBILITY")
print("=" * 80)

for user in users:
    try:
        # Login
        response = requests.post(f"{BASE_URL}/auth/login", json={
            "email": user["email"],
            "password": user["password"]
        })
        
        if response.status_code != 200:
            print(f"\n{user['role']} - Login FAILED: {response.status_code}")
            continue
            
        data = response.json()
        token = data.get("accessToken") or data.get("token")
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get tickets
        tickets_response = requests.get(f"{BASE_URL}/tickets/my", headers=headers)
        tickets = tickets_response.json()
        
        print(f"\n{user['role']} ({user['email']}):")
        print(f"  Ticket Count: {len(tickets)}")
        if len(tickets) > 0:
            print(f"  First 3 tickets:")
            for ticket in tickets[:3]:
                print(f"    - {ticket.get('ticketNumber')}: {ticket.get('title')} ({ticket.get('status')})")
    except Exception as e:
        print(f"\n{user['role']} - ERROR: {str(e)}")

print("\n" + "=" * 80)
print("DATABASE - ACTUAL TICKET COUNT FOR SITE 1")
print("=" * 80)

import mysql.connector
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor()
cursor.execute("SELECT COUNT(*) FROM tickets WHERE site_id = '1'")
total = cursor.fetchone()[0]
print(f"Total tickets in Site 1: {total}")

cursor.execute("SELECT COUNT(*) FROM tickets WHERE site_id = '1' AND status IN ('acik', 'islemde')")
open_count = cursor.fetchone()[0]
print(f"Open/In Progress tickets: {open_count}")

cursor.close()
conn.close()

print("\n" + "=" * 80)
print("EXPECTED: All roles should see {total} tickets")
print("=" * 80)
