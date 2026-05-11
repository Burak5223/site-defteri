import mysql.connector

def connect_db():
    return mysql.connector.connect(
        host='localhost',
        user='root',
        password='Hilton5252.',
        database='smart_site_management'
    )

def check_apartments():
    conn = connect_db()
    cursor = conn.cursor(dictionary=True)
    
    print("=== MEVCUT DAIRE DURUMU ===\n")
    
    cursor.execute("""
        SELECT a.id, a.unit_number, a.block_id, b.name as block_name, a.site_id
        FROM apartments a
        LEFT JOIN blocks b ON a.block_id = b.id
        WHERE a.is_deleted = 0
        ORDER BY a.site_id, b.name, CAST(a.unit_number AS UNSIGNED)
    """)
    apartments = cursor.fetchall()
    
    current_site = None
    current_block = None
    
    for apt in apartments:
        if apt['site_id'] != current_site:
            current_site = apt['site_id']
            print(f"\n{'='*50}")
            print(f"SİTE: {current_site if current_site else '(boş)'}")
            print(f"{'='*50}")
            current_block = None
        
        if apt['block_name'] != current_block:
            current_block = apt['block_name']
            print(f"\n  BLOK: {current_block}")
        
        print(f"    Daire {apt['unit_number']}")
    
    print(f"\n\nToplam {len(apartments)} daire")
    
    # Duplicate kontrolü
    print("\n=== DUPLICATE KONTROL ===")
    cursor.execute("""
        SELECT site_id, unit_number, COUNT(*) as count
        FROM apartments
        WHERE is_deleted = 0
        GROUP BY site_id, unit_number
        HAVING count > 1
    """)
    duplicates = cursor.fetchall()
    
    if duplicates:
        print("⚠ DUPLICATE DAİRELER BULUNDU:")
        for dup in duplicates:
            print(f"  Site {dup['site_id']}, Daire {dup['unit_number']}: {dup['count']} adet")
    else:
        print("✓ Duplicate daire yok")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    check_apartments()
