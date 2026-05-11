import mysql.connector

def connect_db():
    return mysql.connector.connect(
        host='localhost',
        user='root',
        password='Hilton5252.',
        database='smart_site_management'
    )

def assign_residents():
    conn = connect_db()
    cursor = conn.cursor(dictionary=True)
    
    print("=== MEVCUT DURUM ===\n")
    
    # Site 1'deki kullanıcıları say
    cursor.execute("""
        SELECT COUNT(*) as count
        FROM users
        WHERE site_id = '1' AND is_deleted = 0
    """)
    user_count = cursor.fetchone()['count']
    print(f"Site 1'de toplam {user_count} kullanıcı var")
    
    # Site 1'deki daireleri say
    cursor.execute("""
        SELECT COUNT(*) as count
        FROM apartments
        WHERE site_id = '1' AND is_deleted = 0
    """)
    apt_count = cursor.fetchone()['count']
    print(f"Site 1'de toplam {apt_count} daire var\n")
    
    if user_count == 0:
        print("⚠ Site 1'de kullanıcı yok!")
        cursor.close()
        conn.close()
        return
    
    print("=== DAİRELERİ TEMİZLEME ===\n")
    
    # Tüm dairelerin owner bilgilerini temizle
    cursor.execute("""
        UPDATE apartments
        SET owner_user_id = NULL, current_resident_id = NULL
        WHERE site_id = '1'
    """)
    print(f"✓ {cursor.rowcount} daire temizlendi")
    conn.commit()
    
    print("\n=== SAKİNLERİ ATAMA ===\n")
    
    # Site 1'deki tüm daireleri al
    cursor.execute("""
        SELECT id, unit_number
        FROM apartments
        WHERE site_id = '1' AND is_deleted = 0
        ORDER BY CAST(unit_number AS UNSIGNED)
    """)
    apartments = cursor.fetchall()
    
    # Site 1'deki tüm kullanıcıları al
    cursor.execute("""
        SELECT id, full_name
        FROM users
        WHERE site_id = '1' AND is_deleted = 0
        ORDER BY full_name
    """)
    users = cursor.fetchall()
    
    print(f"{len(apartments)} daireye {len(users)} kullanıcı atanacak\n")
    
    # Her daireye bir kullanıcı ata (döngüsel)
    assigned = 0
    for i, apt in enumerate(apartments):
        user = users[i % len(users)]
        
        cursor.execute("""
            UPDATE apartments
            SET owner_user_id = %s, current_resident_id = %s
            WHERE id = %s
        """, (user['id'], user['id'], apt['id']))
        assigned += 1
    
    conn.commit()
    
    print(f"✓ {assigned} daireye sakin atandı")
    
    print("\n=== BLOK BAZINDA DAĞILIM ===\n")
    
    cursor.execute("""
        SELECT 
            b.name as block_name,
            COUNT(a.id) as total_apartments,
            SUM(CASE WHEN a.owner_user_id IS NOT NULL THEN 1 ELSE 0 END) as filled_apartments
        FROM blocks b
        LEFT JOIN apartments a ON b.id = a.block_id AND a.is_deleted = 0
        WHERE b.site_id = '1'
        GROUP BY b.id, b.name
        ORDER BY b.name
    """)
    
    blocks = cursor.fetchall()
    for block in blocks:
        print(f"{block['block_name']}: {block['filled_apartments']}/{block['total_apartments']} daire dolu")
    
    print("\n=== ÖRNEK DAİRELER ===\n")
    
    cursor.execute("""
        SELECT 
            a.unit_number,
            b.name as block_name,
            u.full_name
        FROM apartments a
        JOIN blocks b ON a.block_id = b.id
        LEFT JOIN users u ON a.owner_user_id = u.id
        WHERE a.site_id = '1' AND a.is_deleted = 0
        ORDER BY CAST(a.unit_number AS UNSIGNED)
        LIMIT 20
    """)
    
    examples = cursor.fetchall()
    for ex in examples:
        owner = ex['full_name'] if ex['full_name'] else "Boş"
        print(f"Daire {ex['unit_number']} ({ex['block_name']}): {owner}")
    
    cursor.close()
    conn.close()
    
    print("\n✓ İşlem tamamlandı!")

if __name__ == "__main__":
    assign_residents()
