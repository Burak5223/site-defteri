import mysql.connector

def connect_db():
    return mysql.connector.connect(
        host='localhost',
        user='root',
        password='Hilton5252.',
        database='smart_site_management'
    )

def test_block_apartments():
    conn = connect_db()
    cursor = conn.cursor(dictionary=True)
    
    print("=== B BLOK DAİRELERİ (Veritabanı) ===\n")
    
    # B Blok'un ID'sini bul
    cursor.execute("""
        SELECT id, name, site_id 
        FROM blocks 
        WHERE name LIKE '%B%' AND site_id = '1'
    """)
    b_blocks = cursor.fetchall()
    
    for block in b_blocks:
        print(f"Blok: {block['name']}, ID: {block['id']}, Site: {block['site_id']}")
        
        # Bu bloktaki daireleri getir
        cursor.execute("""
            SELECT id, unit_number, block_id
            FROM apartments
            WHERE block_id = %s AND is_deleted = 0
            ORDER BY CAST(unit_number AS UNSIGNED)
        """, (block['id'],))
        
        apartments = cursor.fetchall()
        print(f"\nToplam {len(apartments)} daire:")
        for apt in apartments:
            print(f"  Daire {apt['unit_number']} (ID: {apt['id']})")
    
    print("\n\n=== TÜM BLOKLAR VE DAİRE SAYILARI ===\n")
    cursor.execute("""
        SELECT b.id, b.name, b.site_id, COUNT(a.id) as apartment_count
        FROM blocks b
        LEFT JOIN apartments a ON b.id = a.block_id AND a.is_deleted = 0
        WHERE b.site_id = '1'
        GROUP BY b.id, b.name, b.site_id
        ORDER BY b.name
    """)
    
    blocks = cursor.fetchall()
    for block in blocks:
        print(f"{block['name']}: {block['apartment_count']} daire (Block ID: {block['id']})")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    test_block_apartments()
