#!/usr/bin/env python3
import requests

BASE_URL = "http://localhost:8080/api"
RESIDENT_EMAIL = "sakin@site.com"
RESIDENT_PASSWORD = "sakin123"

print("Testing login...")
response = requests.post(
    f"{BASE_URL}/auth/login",
    json={"email": RESIDENT_EMAIL, "password": RESIDENT_PASSWORD}
)

print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")

if response.status_code == 200:
    data = response.json()
    token = data.get('token')
    print(f"\nToken: {token}")
    print(f"Token type: {type(token)}")
    print(f"Token is None: {token is None}")
    print(f"Token is empty: {not token}")
    print(f"User data: {data.get('user')}")
