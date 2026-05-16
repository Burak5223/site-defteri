import mysql.connector
import bcrypt

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

# Hash passwords
security_hash = bcrypt.hashpw("security123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
cleaning_hash = bcrypt.hashpw("cleaning123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# Update security user password
cursor.execute("UPDATE users SET password_hash = %s WHERE email = 'security@site.com'", (security_hash,))
print(f"✓ Updated security password hash")

# Update cleaning user password
cursor.execute("UPDATE users SET password_hash = %s WHERE email = 'cleaning@site.com'", (cleaning_hash,))
print(f"✓ Updated cleaning password hash")

conn.commit()
cursor.close()
conn.close()

print("\n✓ Passwords updated with BCrypt hashes")
