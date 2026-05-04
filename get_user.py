import mysql.connector

try:
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="Hilton5252.",
        database="smart_site_management"
    )
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT email, full_name, phone, status FROM users WHERE phone LIKE '%5539304912%' OR full_name LIKE '%Ahmet%'")
    users = cursor.fetchall()
    print("USERS FOUND:")
    for u in users:
        print(u)
except Exception as e:
    print("DB ERROR:", e)
finally:
    if 'conn' in locals() and conn.is_connected():
        cursor.close()
        conn.close()
