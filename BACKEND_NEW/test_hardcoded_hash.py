#!/usr/bin/env python3
import bcrypt

# The hardcoded hash from the script
hash_str = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"

# Test different passwords
test_passwords = [
    "password123",
    "Password123",
    "123456",
    "admin123",
    "test123"
]

print("Testing hardcoded hash...")
print(f"Hash: {hash_str}")
print()

for pwd in test_passwords:
    try:
        if bcrypt.checkpw(pwd.encode('utf-8'), hash_str.encode('utf-8')):
            print(f"✓ MATCH: '{pwd}'")
        else:
            print(f"✗ No match: '{pwd}'")
    except Exception as e:
        print(f"Error testing '{pwd}': {e}")
