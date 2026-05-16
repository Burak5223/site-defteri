#!/usr/bin/env python3
"""Test voting visibility for all users including sakin"""

import requests
import json

BASE_URL = "http://localhost:8080/api"

def login(email, password):
    """Login and get token"""
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": email,
        "password": password
    })
    if response.status_code == 200:
        data = response.json()
        return data.get('token')
    else:
        print(f"Login failed for {email}: {response.status_code}")
        print(response.text)
        return None

def get_votings(token, site_id="1"):
    """Get votings for a site"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/sites/{site_id}/voting-topics", headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Failed to get votings: {response.status_code}")
        print(response.text)
        return []

def test_user_voting_access(email, password, role_name):
    """Test voting access for a user"""
    print(f"\n{'='*60}")
    print(f"Testing {role_name} ({email})")
    print('='*60)
    
    token = login(email, password)
    if not token:
        print(f"❌ Login failed for {role_name}")
        return
    
    print(f"✅ Login successful")
    
    votings = get_votings(token)
    print(f"\n📊 Found {len(votings)} votings")
    
    for voting in votings:
        print(f"\n📋 Oylama: {voting['title']}")
        print(f"   Açıklama: {voting['description']}")
        print(f"   Durum: {voting['status']}")
        print(f"   Toplam Oy: {voting['totalVotes']}")
        print(f"   Kullanıcı Oy Kullandı mı: {voting.get('hasVoted', False)}")
        print(f"   Bitiş: {voting['endDate']}")
        
        if voting.get('options'):
            print(f"   Seçenekler ({len(voting['options'])} adet):")
            for opt in voting['options']:
                print(f"      - {opt['optionText']}: {opt['voteCount']} oy ({opt.get('percentage', 0):.1f}%)")
        else:
            print(f"   ⚠️  Seçenekler boş!")

if __name__ == "__main__":
    print("🧪 Testing Voting Visibility for All Users")
    print("="*60)
    
    # Test all users
    test_user_voting_access("admin@site.com", "admin123", "Admin")
    test_user_voting_access("sakin@site.com", "sakin123", "Sakin (Resident)")
    test_user_voting_access("security@site.com", "security123", "Security")
    test_user_voting_access("cleaning@site.com", "cleaning123", "Cleaning")
    
    print("\n" + "="*60)
    print("✅ Test completed")
