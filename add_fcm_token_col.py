import mysql.connector

try:
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="Hilton5252.",
        database="smart_site_management"
    )
    cursor = conn.cursor()
    cursor.execute("ALTER TABLE users ADD COLUMN fcm_token VARCHAR(255) DEFAULT NULL;")
    conn.commit()
    print("Column fcm_token added successfully.")
except Exception as e:
    print("DB ERROR:", e)
finally:
    if 'conn' in locals() and conn.is_connected():
        cursor.close()
        conn.close()
