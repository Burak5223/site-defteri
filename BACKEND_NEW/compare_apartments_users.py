import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

print("=== APARTMENTS vs USERS COMPARISON ===\n")

# 1. Toplam daire sayısı
cursor.execute("SELECT COUNT(*) FROM apartments WHERE site_id = '1'")
total_apartments = cursor.fetchone()[0]
print(f"Total apartments in site 1: {total_apartments}")

# 2. Sakin atanmış daireler
cursor.execute("""
    SELECT COUNT(*) FROM apartments 
    WHERE site_id = '1' AND (current_resident_id IS NOT NULL OR owner_user_id IS NOT NULL)
""")
apartments_with_residents = cursor.fetchone()[0]
print(f"Apartments with residents: {apartments_with_residents}")

# 3. Toplam kullanıcı sayısı
cursor.execute("SELECT COUNT(*) FROM users")
total_users = cursor.fetchone()[0]
print(f"Total users in database: {total_users}")

# 4. Dairelerde atanmış benzersiz kullanıcılar
cursor.execute("""
    SELECT COUNT(DISTINCT user_id) FROM (
        SELECT current_resident_id as user_id FROM apartments WHERE current_resident_id IS NOT NULL
        UNION
        SELECT owner_user_id as user_id FROM apartments WHERE owner_user_id IS NOT NULL
    ) as all_residents
""")
unique_residents = cursor.fetchone()[0]
print(f"Unique users assigned to apartments: {unique_residents}")

# 5. Aynı kullanıcının birden fazla dairede olup olmadığını kontrol et
cursor.execute("""
    SELECT user_id, COUNT(*) as apartment_count
    FROM (
        SELECT current_resident_id as user_id FROM apartments WHERE current_resident_id IS NOT NULL
        UNION ALL
        SELECT owner_user_id as user_id FROM apartments WHERE owner_user_id IS NOT NULL
    ) as all_assignments
    GROUP BY user_id
    HAVING COUNT(*) > 1
    ORDER BY apartment_count DESC
    LIMIT 10
""")

print("\n=== USERS WITH MULTIPLE APARTMENTS ===")
multi_apartment_users = cursor.fetchall()
if multi_apartment_users:
    for user_id, count in multi_apartment_users:
        cursor.execute("SELECT full_name FROM users WHERE id = %s", (user_id,))
        name = cursor.fetchone()
        print(f"{name[0] if name else 'Unknown'} (ID: {user_id}): {count} apartments")
else:
    print("No users with multiple apartments")

# 6. Boş daireler
cursor.execute("""
    SELECT COUNT(*) FROM apartments 
    WHERE site_id = '1' AND current_resident_id IS NULL AND owner_user_id IS NULL
""")
empty_apartments = cursor.fetchone()[0]
print(f"\nEmpty apartments (no residents): {empty_apartments}")

print("\n=== SUMMARY ===")
print(f"Apartments: {total_apartments}")
print(f"Apartments with residents: {apartments_with_residents}")
print(f"Unique resident users: {unique_residents}")
print(f"Difference: {apartments_with_residents - unique_residents} (users assigned to multiple apartments)")

cursor.close()
conn.close()
