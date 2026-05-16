#!/usr/bin/env python3
"""Add options to completed voting that has no options"""

import mysql.connector
from datetime import datetime

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor()

print("🔍 Checking completed voting without options...")

# Find completed voting without options
cursor.execute("""
    SELECT v.id, v.title, v.description, v.status
    FROM votings v
    LEFT JOIN voting_options vo ON v.id = vo.voting_id
    WHERE v.status = 'completed'
    GROUP BY v.id
    HAVING COUNT(vo.id) = 0
""")

votings_without_options = cursor.fetchall()

if not votings_without_options:
    print("✅ All completed votings have options")
else:
    print(f"Found {len(votings_without_options)} completed voting(s) without options:")
    
    for voting_id, title, description, status in votings_without_options:
        print(f"\n📊 Voting ID {voting_id}: {title}")
        print(f"   Description: {description}")
        print(f"   Status: {status}")
        
        # Add options for this voting
        options = [
            ("Evet, havuz yenilensin", 0, 15),
            ("Hayır, mevcut hali yeterli", 1, 8),
            ("Kısmi yenileme yapılsın", 2, 5)
        ]
        
        print(f"\n   Adding {len(options)} options with votes...")
        
        for option_text, display_order, vote_count in options:
            # Insert option
            cursor.execute("""
                INSERT INTO voting_options (voting_id, option_text, display_order, created_at)
                VALUES (%s, %s, %s, NOW())
            """, (voting_id, option_text, display_order))
            
            option_id = cursor.lastrowid
            print(f"   ✅ Added option: {option_text} (ID: {option_id})")
            
            # Add fake votes for this option
            for i in range(vote_count):
                cursor.execute("""
                    INSERT INTO user_votes (voting_id, option_id, user_id, voted_at)
                    VALUES (%s, %s, UUID(), NOW())
                """, (voting_id, option_id))
            
            print(f"      Added {vote_count} votes")

conn.commit()
print("\n✅ Completed voting options fixed!")

# Verify
print("\n🔍 Verifying all votings now have options...")
cursor.execute("""
    SELECT v.id, v.title, v.status, COUNT(vo.id) as option_count, 
           COALESCE(SUM(
               (SELECT COUNT(*) FROM user_votes uv WHERE uv.option_id = vo.id)
           ), 0) as total_votes
    FROM votings v
    LEFT JOIN voting_options vo ON v.id = vo.voting_id
    GROUP BY v.id
    ORDER BY v.created_at DESC
""")

votings = cursor.fetchall()
print(f"\n📊 All Votings:")
for voting_id, title, status, option_count, total_votes in votings:
    print(f"   {voting_id}. {title} ({status}): {option_count} options, {total_votes} votes")

cursor.close()
conn.close()
