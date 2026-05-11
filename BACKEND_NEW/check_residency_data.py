#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Check residency_history data
"""

import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor(dictionary=True)

print("=" * 80)
print("RESIDENCY_HISTORY DATA CHECK")
print("=" * 80)

# Check total residencies
print("\n1. Total residencies:")
cursor.execute("SELECT COUNT(*) as total FROM residency_history")
total = cursor.fetchone()
print(f"   Total: {total['total']}")

# Check active residencies
print("\n2. Active residencies:")
cursor.execute("""
    SELECT COUNT(*) as total,
           SUM(CASE WHEN is_owner = 1 THEN 1 ELSE 0 END) as owners,
           SUM(CASE WHEN is_owner = 0 THEN 1 ELSE 0 END) as tenants
    FROM residency_history
    WHERE status = 'active' AND is_deleted = FALSE
""")
active = cursor.fetchone()
print(f"   Total active: {active['total']}")
print(f"   Owners: {active['owners']}")
print(f"   Tenants: {active['tenants']}")

# Check sample data
print("\n3. Sample active residencies (first 5):")
cursor.execute("""
    SELECT 
        rh.id,
        a.block_name,
        a.unit_number,
        u.full_name,
        rh.is_owner,
        rh.status
    FROM residency_history rh
    JOIN apartments a ON rh.apartment_id = a.id
    JOIN users u ON rh.user_id = u.id
    WHERE rh.status = 'active' AND rh.is_deleted = FALSE
    ORDER BY a.block_name, CAST(a.unit_number AS UNSIGNED)
    LIMIT 5
""")

samples = cursor.fetchall()
for res in samples:
    owner_type = "Malik" if res['is_owner'] else "Kiracı"
    print(f"   {res['block_name']} {res['unit_number']}: {res['full_name']} ({owner_type})")

# Check if any residencies exist for A Blok
print("\n4. A Blok residencies:")
cursor.execute("""
    SELECT COUNT(*) as total
    FROM residency_history rh
    JOIN apartments a ON rh.apartment_id = a.id
    WHERE a.block_name = 'A Blok' 
      AND rh.status = 'active' 
      AND rh.is_deleted = FALSE
""")
a_blok = cursor.fetchone()
print(f"   A Blok active residencies: {a_blok['total']}")

cursor.close()
conn.close()

print("\n" + "=" * 80)
