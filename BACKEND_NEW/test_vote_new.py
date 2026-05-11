#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test voting on a voting where user hasn't voted yet
"""

import requests
import json

BASE_URL = "http://localhost:8080/api"

def test_new_vote():
    print("=" * 60)
    print("TEST NEW VOTE")
    print("=" * 60)
    
    # Login
    print("\n1. Logging in as sakin@site.com...")
    login_response = requests.post(
        f"{BASE_URL}/auth/login",
        json={
            "email": "sakin@site.com",
            "password": "sakin123"
        }
    )
    
    login_data = login_response.json()
    token = login_data.get("accessToken")
    site_id = login_data.get("siteId", "1")
    print(f"✅ Login successful!")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Get votings
    print(f"\n2. Getting votings...")
    votings_response = requests.get(
        f"{BASE_URL}/sites/{site_id}/e-voting",
        headers=headers
    )
    
    votings = votings_response.json()
    
    # Find a voting where user hasn't voted
    unvoted_voting = None
    for voting in votings:
        if not voting.get('hasVoted'):
            unvoted_voting = voting
            break
    
    if not unvoted_voting:
        print("⚠️  User has already voted in all votings")
        return
    
    voting_id = unvoted_voting.get('id')
    print(f"✅ Found unvoted voting: {unvoted_voting.get('title')} (ID: {voting_id})")
    print(f"   Start: {unvoted_voting.get('startDate')}")
    print(f"   End: {unvoted_voting.get('endDate')}")
    
    # Cast vote
    options = unvoted_voting.get('options', [])
    if not options:
        print("❌ No options available")
        return
    
    # Vote for second option
    option_to_vote = options[1] if len(options) > 1 else options[0]
    option_id = option_to_vote.get('id')
    
    print(f"\n3. Casting vote for option: {option_to_vote.get('optionText')} (ID: {option_id})...")
    
    vote_response = requests.post(
        f"{BASE_URL}/e-voting/vote",
        headers=headers,
        json={
            "votingId": voting_id,
            "optionId": option_id
        }
    )
    
    if vote_response.status_code != 200:
        print(f"❌ Failed to cast vote: {vote_response.status_code}")
        print(vote_response.text)
        return
    
    vote_data = vote_response.json()
    print(f"✅ Vote cast successfully!")
    print(f"   Total votes now: {vote_data.get('totalVotes')}")
    print(f"   Has voted: {vote_data.get('hasVoted')}")
    
    # Show updated results
    print(f"\n4. Updated voting results:")
    for option in vote_data.get('options', []):
        print(f"   * {option.get('optionText')} - {option.get('voteCount')} votes ({option.get('percentage'):.1f}%)")
    
    print("\n" + "=" * 60)
    print("✅ VOTE TEST COMPLETED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    try:
        test_new_vote()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
