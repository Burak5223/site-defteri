#!/usr/bin/env python3
"""
Generate bcrypt hash for super123
"""
import bcrypt

password = "super123"
salt = bcrypt.gensalt(rounds=12)
hashed = bcrypt.hashpw(password.encode('utf-8'), salt)

print(f"Password: {password}")
print(f"Hash: {hashed.decode('utf-8')}")

# Test the hash
if bcrypt.checkpw(password.encode('utf-8'), hashed):
    print("✓ Hash verification successful")
else:
    print("❌ Hash verification failed")
