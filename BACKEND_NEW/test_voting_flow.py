#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test E-Voting Flow
Tests the complete voting flow after fixing time validation
"""

import requests
import json

BASE_URL = "http://localhost:8080/api"

def test_voting_flow():
    print("=" * 60)
    print("E-VOTING FLOW TEST")
    print("=" * 60)
    
    # Step 1: Login as resident
    print("\n1. Logging in as resident (sakin@site.com)...")
    login_response = requests.post(
        f"{BASE_URL}/auth/login",
        json={
            "email": "sakin@site.com",
            "password": "sakin123"
        }
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(login_response.text)
        return
    
    login_data = login_response.json()
    print(f"   Login response: {json.dumps(login_data, indent=2)}")
    
    token = login_data.get("token") or login_data.get("accessToken")
    site_id = login_data.get("siteId") or login_data.get("user", {}).get("siteId", "1")
    
    if not token:
        print(f"❌ No token in response")
        return
    
    print(f"✅ Login successful! Token: {token[:20]}...")
    print(f"   Site ID: {site_id}")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Step 2: Get votings
    print(f"\n2. Getting votings for site {site_id}...")
    votings_response = requests.get(
        f"{BASE_URL}/sites/{site_id}/e-voting",
        headers=headers
    )
    
    if votings_response.status_code != 200:
        print(f"❌ Failed to get votings: {votings_response.status_code}")
        print(votings_response.text)
        return
    
    votings = votings_response.json()
    print(f"✅ Found {len(votings)} voting(s)")
    
    if not votings:
        print("⚠️  No votings found. Please create a voting first.")
        return
    
    # Display votings
    for i, voting in enumerate(votings):
        print(f"\n   Voting {i+1}:")
        print(f"   - ID: {voting.get('id')}")
        print(f"   - Title: {voting.get('title')}")
        print(f"   - Status: {voting.get('status')}")
        print(f"   - Start: {voting.get('startDate')}")
        print(f"   - End: {voting.get('endDate')}")
        print(f"   - Has Voted: {voting.get('hasVoted')}")
        print(f"   - Total Votes: {voting.get('totalVotes')}")
        print(f"   - Options:")
        for option in voting.get('options', []):
            print(f"     * {option.get('optionText')} (ID: {option.get('id')}) - {option.get('voteCount')} votes ({option.get('percentage'):.1f}%)")
    
    # Step 3: Cast vote if not already voted
    first_voting = votings[0]
    voting_id = first_voting.get('id')
    has_voted = first_voting.get('hasVoted')
    
    if has_voted:
        print(f"\n3. ✅ User has already voted in voting {voting_id}")
        print(f"   Voted option ID: {first_voting.get('userVotedOptionId')}")
    else:
        print(f"\n3. Casting vote for voting {voting_id}...")
        
        # Get first option
        options = first_voting.get('options', [])
        if not options:
            print("❌ No options available")
            return
        
        first_option_id = options[0].get('id')
        print(f"   Voting for option: {options[0].get('optionText')} (ID: {first_option_id})")
        
        vote_response = requests.post(
            f"{BASE_URL}/e-voting/vote",
            headers=headers,
            json={
                "votingId": voting_id,
                "optionId": first_option_id
            }
        )
        
        if vote_response.status_code != 200:
            print(f"❌ Failed to cast vote: {vote_response.status_code}")
            print(vote_response.text)
            return
        
        vote_data = vote_response.json()
        print(f"✅ Vote cast successfully!")
        print(f"   Total votes now: {vote_data.get('totalVotes')}")
    
    # Step 4: Get updated voting results
    print(f"\n4. Getting updated voting results...")
    updated_response = requests.get(
        f"{BASE_URL}/sites/{site_id}/e-voting",
        headers=headers
    )
    
    if updated_response.status_code != 200:
        print(f"❌ Failed to get updated results: {updated_response.status_code}")
        return
    
    updated_votings = updated_response.json()
    updated_voting = next((v for v in updated_votings if v.get('id') == voting_id), None)
    
    if updated_voting:
        print(f"✅ Updated results:")
        print(f"   - Has Voted: {updated_voting.get('hasVoted')}")
        print(f"   - Total Votes: {updated_voting.get('totalVotes')}")
        print(f"   - Options:")
        for option in updated_voting.get('options', []):
            print(f"     * {option.get('optionText')} - {option.get('voteCount')} votes ({option.get('percentage'):.1f}%)")
    
    print("\n" + "=" * 60)
    print("✅ E-VOTING TEST COMPLETED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    try:
        test_voting_flow()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
