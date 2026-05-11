import mysql.connector

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

print("=" * 80)
print("RESIDENCY_HISTORY TABLO YAPISI")
print("=" * 80)

cursor.execute("DESCRIBE residency_history")
columns = cursor.fetchall()

for column in columns:
    print(f"{column[0]}: {column[1]} {column[2]} {column[3]} {column[4]}")

print("\n" + "=" * 80)

cursor.close()
conn.close()
