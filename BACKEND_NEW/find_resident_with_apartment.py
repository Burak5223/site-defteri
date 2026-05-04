#!/usr/bin/env python3
import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)

cursor = conn.cursor(dictionary=True)

# Check users table structure
cursor.execute("DESCRIBE users")
print("\nUsers Table Structure:")
print("="*80)
for col in cursor.fetchall():
    print(f"{col['Field']}: {col['Type']}")

print("\n\nChecking for users with email containing 'site.com':")
print("="*80)

# Find users
cursor.execute("""
    SELECT id, full_name, email
    FROM users
    WHERE email LIKE '%site.com%'
    LIMIT 10
""")

results = cursor.fetchall()

print("\nUsers:")
print("="*80)
for r in results:
    print(f"Email: {r['email']}")
    print(f"Name: {r['full_name']}")
    print(f"ID: {r['id']}")
    print("-"*80)

conn.close()
