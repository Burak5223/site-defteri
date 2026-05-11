import mysql.connector

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor(dictionary=True)

print("=== CHECKING user_site_memberships STRUCTURE ===\n")

# Get table structure
cursor.execute("SHOW CREATE TABLE user_site_memberships")
result = cursor.fetchone()
print("Table structure:")
print(result['Create Table'])
print()

# Check existing values
cursor.execute("""
    SELECT DISTINCT user_type, role_type 
    FROM user_site_memberships 
    LIMIT 10
""")

print("\n=== EXISTING VALUES ===")
results = cursor.fetchall()
for row in results:
    print(f"user_type: {row['user_type']}, role_type: {row['role_type']}")

cursor.close()
conn.close()
