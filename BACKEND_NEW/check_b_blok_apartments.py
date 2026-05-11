#!/usr/bin/env python3
import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

print("B Blok Apartments:")
cursor.execute("""
    SELECT b.name, a.unit_number, a.id
    FROM apartments a
    JOIN blocks b ON a.block_id = b.id
    WHERE b.name = 'B Blok'
    ORDER BY CAST(a.unit_number AS UNSIGNED)
""")

apartments = cursor.fetchall()
for apt in apartments:
    print(f"  {apt[0]} - {apt[1]} (ID: {apt[2]})")

print(f"\nTotal: {len(apartments)} apartments")

cursor.close()
conn.close()
