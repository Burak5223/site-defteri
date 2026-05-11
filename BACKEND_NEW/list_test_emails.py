#!/usr/bin/env python3
import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)
cursor = conn.cursor()

cursor.execute("SELECT email FROM users WHERE email LIKE '%yesilvadi.com' ORDER BY email LIMIT 10")
emails = cursor.fetchall()

print("First 10 yesilvadi.com emails:")
for email in emails:
    print(email[0])

cursor.close()
conn.close()
