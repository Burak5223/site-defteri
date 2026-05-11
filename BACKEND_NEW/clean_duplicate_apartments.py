import mysql.connector

def connect_db():
    return mysql.connector.connect(
        host='localhost',
        user='root',
        password='Hilton5252.',
        database='smart_site_management'
    )

def clean_duplicates():
    conn = connect_db()
    cursor = conn.cursor(dictionary=True)
    
    print("=== ESKİ DAİRELERİ TEMİZLEME ===\n")
    
    # Integer ID'li eski daireleri bul ve sil (sadece Site 1 ve boş site için)
    cursor.execute("""
        SELECT id, unit_number, block_id, site_id
        FROM apartments
        WHERE CAST(id AS CHAR) IN ('1', '2', '3', '4', '5') AND is_deleted = 0
    """)
    old_apartments = cursor.fetchall()
    
    print(f"Silinecek eski daireler ({len(old_apartments)} adet):")
    for apt in old_apartments:
        print(f"  ID: {apt['id']}, Daire: {apt['unit_number']}, Block: {apt['block_id']}, Site: {apt['site_id']}")
    
    if old_apartments:
        # Bu daireleri soft delete yap
        cursor.execute("""
            UPDATE apartments
            SET is_deleted = 1
            WHERE CAST(id AS CHAR) IN ('1', '2', '3', '4', '5')
        """)
        print(f"\n✓ {len(old_apartments)} eski daire silindi (soft delete)")
    
    conn.commit()
    
    print("\n=== YENİ DURUM ===\n")
    
    # Site 1 için blok bazında daire sayıları
    cursor.execute("""
        SELECT b.name, COUNT(a.id) as count
        FROM blocks b
        LEFT JOIN apartments a ON b.id = a.block_id AND a.is_deleted = 0
        WHERE b.site_id = '1'
        GROUP BY b.id, b.name
        ORDER BY b.name
    """)
    blocks = cursor.fetchall()
    
    for block in blocks:
        print(f"{block['name']}: {block['count']} daire")
    
    # Her bloktaki daire numaralarını göster
    print("\n=== BLOK BAZINDA DAİRE NUMARALARI ===\n")
    
    for block in blocks:
        cursor.execute("""
            SELECT a.unit_number
            FROM apartments a
            JOIN blocks b ON a.block_id = b.id
            WHERE b.name = %s AND b.site_id = '1' AND a.is_deleted = 0
            ORDER BY CAST(a.unit_number AS UNSIGNED)
            LIMIT 5
        """, (block['name'],))
        
        apartments = cursor.fetchall()
        numbers = [apt['unit_number'] for apt in apartments]
        print(f"{block['name']}: {', '.join(numbers)}...")
    
    # Duplicate kontrolü
    print("\n=== DUPLICATE KONTROL ===")
    cursor.execute("""
        SELECT site_id, unit_number, COUNT(*) as count
        FROM apartments
        WHERE is_deleted = 0 AND site_id = '1'
        GROUP BY site_id, unit_number
        HAVING count > 1
    """)
    duplicates = cursor.fetchall()
    
    if duplicates:
        print("⚠ DUPLICATE DAİRELER:")
        for dup in duplicates:
            print(f"  Daire {dup['unit_number']}: {dup['count']} adet")
    else:
        print("✓ Duplicate daire yok")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    clean_duplicates()
