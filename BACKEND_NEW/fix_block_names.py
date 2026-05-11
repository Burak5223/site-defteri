import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor()

cursor.execute("""
    UPDATE apartments a 
    JOIN blocks b ON a.block_id = b.id 
    SET a.block_name = b.name 
    WHERE a.site_id = '1'
""")

conn.commit()
print(f"✓ {cursor.rowcount} dairenin blok adı güncellendi")

cursor.close()
conn.close()
