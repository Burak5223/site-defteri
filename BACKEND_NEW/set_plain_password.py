import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    user='root', 
    password='Hilton5252.',
    database='smart_site_management'
)

cursor = conn.cursor()

print("Setting plain password for admin...")

# Set plain password (the backend should handle hashing)
cursor.execute("UPDATE users SET password_hash = 'admin123' WHERE email = 'admin@site.com'")

print("✓ Admin password set to plain text: admin123")

# Check current password
cursor.execute("SELECT password_hash FROM users WHERE email = 'admin@site.com'")
result = cursor.fetchone()
print(f"Current password hash: {result[0]}")

conn.commit()
conn.close()

print("✅ Password updated!")