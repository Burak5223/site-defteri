#!/usr/bin/env python3
import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)
cursor = conn.cursor()

password_hash = "$2a$10$rN8qYIGXWHJKZqKqKqKqKuN8qYIGXWHJKZqKqKqKqKuN8qYIGXWHJK"

cursor.execute("""
    UPDATE users 
    SET email = %s, password_hash = %s, full_name = %s 
    WHERE id = %s
""", ('admin@yeşilvadisitesi.com', password_hash, 'Site Yöneticisi', 'df96fc1f-fc1d-445b-adac-b747be2c6edb'))

conn.commit()
print("✓ Admin updated: admin@yeşilvadisitesi.com / 123456")
conn.close()
