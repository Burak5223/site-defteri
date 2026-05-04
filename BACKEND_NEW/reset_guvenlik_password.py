#!/usr/bin/env python3
import mysql.connector
import bcrypt

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

# Generate BCrypt hash for "guvenlik123"
password = "guvenlik123"
password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

print(f"New password: {password}")
print(f"New hash: {password_hash}")

# Update password
cursor.execute("""
    UPDATE users
    SET password_hash = %s
    WHERE email = 'guvenlik@site.com'
""", (password_hash,))

conn.commit()
print(f"\n✓ Password updated for guvenlik@site.com")
print(f"  Rows affected: {cursor.rowcount}")

cursor.close()
conn.close()
