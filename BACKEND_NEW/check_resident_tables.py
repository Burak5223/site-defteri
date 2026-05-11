import mysql.connector

def connect_db():
    return mysql.connector.connect(
        host='localhost',
        user='root',
        password='Hilton5252.',
        database='smart_site_management'
    )

def check_tables():
    conn = connect_db()
    cursor = conn.cursor(dictionary=True)
    
    print("=== TABLO YAPISI ===\n")
    
    # Tüm tabloları listele
    cursor.execute("SHOW TABLES")
    tables = cursor.fetchall()
    
    relevant_tables = []
    for table in tables:
        table_name = list(table.values())[0]
        if any(keyword in table_name.lower() for keyword in ['user', 'resident', 'apartment', 'member', 'site']):
            relevant_tables.append(table_name)
    
    print("İlgili tablolar:")
    for table in relevant_tables:
        print(f"  - {table}")
    
    print("\n=== USERS TABLOSU ===\n")
    cursor.execute("DESCRIBE users")
    columns = cursor.fetchall()
    for col in columns:
        print(f"  {col['Field']}: {col['Type']}")
    
    print("\n=== APARTMENTS TABLOSU ===\n")
    cursor.execute("DESCRIBE apartments")
    columns = cursor.fetchall()
    for col in columns:
        print(f"  {col['Field']}: {col['Type']}")
    
    print("\n=== APARTMENT_RESIDENTS TABLOSU ===\n")
    cursor.execute("DESCRIBE apartment_residents")
    columns = cursor.fetchall()
    for col in columns:
        print(f"  {col['Field']}: {col['Type']}")
    
    print("\n=== SAKİN SAYILARI ===\n")
    
    # Site 1'deki sakinleri say
    cursor.execute("""
        SELECT COUNT(*) as count
        FROM users
        WHERE role = 'RESIDENT' AND is_deleted = 0 AND site_id = '1'
    """)
    result = cursor.fetchone()
    print(f"Site 1'de toplam {result['count']} sakin")
    
    # Daire sayısı
    cursor.execute("""
        SELECT COUNT(*) as count
        FROM apartments
        WHERE site_id = '1' AND is_deleted = 0
    """)
    result = cursor.fetchone()
    print(f"Site 1'de toplam {result['count']} daire")
    
    # Mevcut ilişkiler
    cursor.execute("""
        SELECT COUNT(*) as count
        FROM apartment_residents ar
        JOIN apartments a ON ar.apartment_id = a.id
        WHERE a.site_id = '1' AND a.is_deleted = 0
    """)
    result = cursor.fetchone()
    print(f"Mevcut daire-sakin ilişkisi: {result['count']}")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    check_tables()
