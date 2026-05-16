import requests
import json

BASE_URL = "http://localhost:8080/api"

# Admin login
admin_response = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "admin@site.com",
    "password": "admin123"
})
admin_data = admin_response.json()
print(f"Admin login response: {admin_data}")
admin_token = admin_data.get("token") or admin_data.get("accessToken")
admin_headers = {"Authorization": f"Bearer {admin_token}"}

# Sakin login
sakin_response = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "sakin@site.com",
    "password": "sakin123"
})
sakin_data = sakin_response.json()
print(f"Sakin login response: {sakin_data}")
sakin_token = sakin_data.get("token") or sakin_data.get("accessToken")
sakin_headers = {"Authorization": f"Bearer {sakin_token}"}

print("=" * 60)
print("ADMIN DASHBOARD")
print("=" * 60)
admin_dashboard = requests.get(f"{BASE_URL}/dashboard", headers=admin_headers).json()
print(f"Admin Dashboard - Open Tickets: {admin_dashboard.get('openTickets', 0)}")
print(f"Admin Dashboard - Total Tickets: {admin_dashboard.get('totalTickets', 0)}")

print("\n" + "=" * 60)
print("ADMIN TICKET LIST")
print("=" * 60)
admin_tickets = requests.get(f"{BASE_URL}/tickets/my", headers=admin_headers).json()
print(f"Admin Ticket List Count: {len(admin_tickets)}")
for ticket in admin_tickets[:5]:
    print(f"  - {ticket['ticketNumber']}: {ticket['title']} ({ticket['status']})")

print("\n" + "=" * 60)
print("SAKIN DASHBOARD")
print("=" * 60)
sakin_dashboard = requests.get(f"{BASE_URL}/dashboard", headers=sakin_headers).json()
print(f"Sakin Dashboard - Open Tickets: {sakin_dashboard.get('openTickets', 0)}")

print("\n" + "=" * 60)
print("SAKIN TICKET LIST")
print("=" * 60)
sakin_tickets = requests.get(f"{BASE_URL}/tickets/my", headers=sakin_headers).json()
print(f"Sakin Ticket List Count: {len(sakin_tickets)}")
for ticket in sakin_tickets[:5]:
    print(f"  - {ticket['ticketNumber']}: {ticket['title']} ({ticket['status']})")

print("\n" + "=" * 60)
print("DATABASE QUERY - ALL TICKETS FOR SITE 1")
print("=" * 60)
import mysql.connector
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor()
cursor.execute("SELECT id, title, status, site_id FROM tickets WHERE site_id = '1'")
all_tickets = cursor.fetchall()
print(f"Total tickets in site 1: {len(all_tickets)}")
open_count = sum(1 for t in all_tickets if t[2] in ['acik', 'islemde'])
print(f"Open/In Progress tickets: {open_count}")
cursor.close()
conn.close()
