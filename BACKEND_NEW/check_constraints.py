import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor(dictionary=True)

cursor.execute("SHOW CREATE TABLE apartments")
result = cursor.fetchone()
print("Apartments tablosu yapısı:")
print(result['Create Table'])

cursor.close()
conn.close()
