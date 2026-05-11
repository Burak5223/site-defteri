import requests
import json

BASE_URL = "http://localhost:8080/api"

print("=== TESTING MESSAGING FLOW ===\n")

# Step 1: Admin login
print("1. Admin login...")
admin_login = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "admin@site.com",
    "password": "admin123"
})
print(f"   Status: {admin_login.status_code}")
admin_data = admin_login.json()
print(f"   Response: {json.dumps(admin_data, indent=2)}")
admin_token = admin_data.get('accessToken') or admin_data.get('token')
admin_id = admin_data.get('userId') or admin_data.get('id')
print(f"   Admin ID: {admin_id}")
print(f"   Admin Token: {admin_token[:50] if admin_token else 'N/A'}...")

# Step 2: Sakin login
print("\n2. Sakin login...")
sakin_login = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "sakin@site.com",
    "password": "sakin123"
})
print(f"   Status: {sakin_login.status_code}")
sakin_data = sakin_login.json()
print(f"   Response keys: {list(sakin_data.keys())}")
sakin_token = sakin_data.get('accessToken') or sakin_data.get('token')
sakin_id = sakin_data.get('userId') or sakin_data.get('id')
sakin_apartment_id = sakin_data.get('user', {}).get('apartmentId')  # Get from user object
print(f"   Sakin ID: {sakin_id}")
print(f"   Sakin Apartment ID: {sakin_apartment_id}")
print(f"   Sakin Token: {sakin_token[:50] if sakin_token else 'N/A'}...")

# Step 3: Admin sends message to Daire 12 (sakin's apartment)
print("\n3. Admin sends message to Daire 12...")
admin_message = requests.post(
    f"{BASE_URL}/messages",
    headers={"Authorization": f"Bearer {admin_token}"},
    json={
        "siteId": "1",
        "chatType": "apartment",
        "apartmentId": sakin_apartment_id,
        "receiverId": None,  # NULL means all residents in apartment will see it
        "body": "Merhaba, bu ay aidat ödemesi için son gün 15'i. Lütfen zamanında ödeme yapınız."
    }
)
print(f"   Status: {admin_message.status_code}")
if admin_message.status_code == 200 or admin_message.status_code == 201:
    admin_msg_data = admin_message.json()
    print(f"   ✓ Message sent successfully!")
    print(f"   Message ID: {admin_msg_data.get('id')}")
else:
    print(f"   ✗ Error: {admin_message.text}")

# Step 4: Sakin checks messages
print("\n4. Sakin checks messages...")
sakin_messages = requests.get(
    f"{BASE_URL}/messages",
    headers={"Authorization": f"Bearer {sakin_token}"},
    params={"siteId": "1"}
)
print(f"   Status: {sakin_messages.status_code}")
if sakin_messages.status_code == 200:
    messages = sakin_messages.json()
    apartment_messages = [m for m in messages if m.get('chatType') == 'apartment' and m.get('apartmentId') == sakin_apartment_id]
    print(f"   ✓ Total messages: {len(messages)}")
    print(f"   ✓ Apartment messages: {len(apartment_messages)}")
    if apartment_messages:
        last_msg = apartment_messages[-1]
        print(f"   Last message: {last_msg.get('body')[:50]}...")
        print(f"   From: {last_msg.get('senderName')}")
else:
    print(f"   ✗ Error: {sakin_messages.text}")

# Step 5: Sakin replies to admin
print("\n5. Sakin replies to admin...")
sakin_reply = requests.post(
    f"{BASE_URL}/messages",
    headers={"Authorization": f"Bearer {sakin_token}"},
    json={
        "siteId": "1",
        "chatType": "apartment",
        "receiverId": admin_id,  # Direct message to admin
        "apartmentId": sakin_apartment_id,
        "body": "Teşekkür ederim, bu hafta içinde ödeme yapacağım."
    }
)
print(f"   Status: {sakin_reply.status_code}")
if sakin_reply.status_code == 200 or sakin_reply.status_code == 201:
    sakin_msg_data = sakin_reply.json()
    print(f"   ✓ Reply sent successfully!")
    print(f"   Message ID: {sakin_msg_data.get('id')}")
else:
    print(f"   ✗ Error: {sakin_reply.text}")

# Step 6: Admin checks messages (should see sakin's reply)
print("\n6. Admin checks messages...")
admin_messages = requests.get(
    f"{BASE_URL}/messages",
    headers={"Authorization": f"Bearer {admin_token}"},
    params={"siteId": "1"}
)
print(f"   Status: {admin_messages.status_code}")
if admin_messages.status_code == 200:
    messages = admin_messages.json()
    # Filter messages from sakin to admin
    sakin_to_admin = [m for m in messages if m.get('senderId') == sakin_id and m.get('receiverId') == admin_id]
    print(f"   ✓ Total messages: {len(messages)}")
    print(f"   ✓ Messages from sakin: {len(sakin_to_admin)}")
    if sakin_to_admin:
        last_msg = sakin_to_admin[-1]
        print(f"   Last message from sakin: {last_msg.get('body')}")
        print(f"   From: {last_msg.get('senderName')}")
else:
    print(f"   ✗ Error: {admin_messages.text}")

# Step 7: Check role groups for sakin (should see admin, security, cleaning boxes)
print("\n7. Checking role groups visible to sakin...")
print("   Sakin should see these role group boxes:")
print("   - Site Yönetimi (group chat)")
print("   - Super Admin (if admin)")
print("   - Yönetici (admin users)")
print("   - Güvenlik (security users)")
print("   - Temizlikçi (cleaning users)")

print("\n✓ Test completed!")
print("\nNOTE: Check the mobile app to verify:")
print("1. Admin can see 'Daireler' section with all apartments")
print("2. Admin can send message to Daire 12")
print("3. Sakin sees message in 'Yönetici' box")
print("4. Sakin can reply")
print("5. Admin sees reply in messages")
