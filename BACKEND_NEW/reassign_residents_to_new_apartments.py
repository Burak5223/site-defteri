import mysql.connector
import random

def connect_db():
    return mysql.connector.connect(
        host='localhost',
        user='root',
        password='Hilton5252.',
        database='smart_site_management'
    )

def reassign_residents():
    conn = connect_db()
    cursor = conn.cursor(dictionary=True)
    
    print("=== MEVCUT DURUM KONTROLÜ ===\n")
    
    # Site 1'deki sakinleri kontrol et (user_roles tablosundan)
    cursor.execute("""
        SELECT COUNT(DISTINCT u.id) as count
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        WHERE u.site_id = '1' AND ur.role_name = 'RESIDENT' AND u.is_deleted = 0
    """)
    resident_count = cursor.fetchone()['count']
    print(f"Site 1'de toplam {resident_count} sakin var")
    
    # Site 1'deki daireleri kontrol et
    cursor.execute("""
        SELECT COUNT(*) as count
        FROM apartments
        WHERE site_id = '1' AND is_deleted = 0
    """)
    apartment_count = cursor.fetchone()['count']
    print(f"Site 1'de toplam {apartment_count} daire var")
    
    # Dolu daire sayısı
    cursor.execute("""
        SELECT COUNT(*) as count
        FROM apartments
        WHERE site_id = '1' AND is_deleted = 0 AND owner_user_id IS NOT NULL
    """)
    filled_count = cursor.fetchone()['count']
    print(f"Mevcut dolu daire sayısı: {filled_count}\n")
    
    if resident_count == 0:
        print("⚠ Site 1'de sakin yok! Önce sakin oluşturulmalı.")
        cursor.close()
        conn.close()
        return
    
    print("=== ESKİ İLİŞKİLERİ TEMİZLEME ===\n")
    
    # Site 1'deki tüm dairelerin owner ve resident bilgilerini temizle
    cursor.execute("""
        UPDATE apartments
        SET owner_user_id = NULL, current_resident_id = NULL
        WHERE site_id = '1'
    """)
    cleared = cursor.rowcount
    print(f"✓ {cleared} dairenin sakin bilgileri temizlendi")
    
    conn.commit()
    
    print("\n=== YENİ İLİŞKİLER OLUŞTURMA ===\n")
    
    # Site 1'deki tüm daireleri al
    cursor.execute("""
        SELECT id, unit_number, block_id
        FROM apartments
        WHERE site_id = '1' AND is_deleted = 0
        ORDER BY CAST(unit_number AS UNSIGNED)
    """)
    apartments = cursor.fetchall()
    
    # Site 1'deki tüm sakinleri al
    cursor.execute("""
        SELECT DISTINCT u.id, u.full_name
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        WHERE u.site_id = '1' AND ur.role_name = 'RESIDENT' AND u.is_deleted = 0
    """)
    residents = cursor.fetchall()
    
    if len(residents) < len(apartments):
        print(f"⚠ Uyarı: {len(apartments)} daire var ama sadece {len(residents)} sakin var")
        print("Her daireye en az 1 sakin atanacak, bazı sakinler birden fazla dairede olacak\n")
    
    # Her daireye sakin ata
    resident_index = 0
    owner_count = 0
    tenant_count = 0
    
    for apt in apartments:
        # Her daireye 1 malik ata (owner_user_id)
        owner = residents[resident_index % len(residents)]
        
        cursor.execute("""
            UPDATE apartments
            SET owner_user_id = %s, current_resident_id = %s
            WHERE id = %s
        """, (owner['id'], owner['id'], apt['id']))
        owner_count += 1
        
        resident_index += 1
    
    conn.commit()
    
    print(f"✓ {owner_count} daireye malik atandı")
    print(f"✓ Toplam {owner_count} ilişki oluşturuldu")
    
    print("\n=== BLOK BAZINDA DAĞILIM ===\n")
    
    cursor.execute("""
        SELECT 
            b.name as block_name,
            COUNT(DISTINCT a.id) as apartment_count,
            COUNT(DISTINCT a.owner_user_id) as owner_count
        FROM blocks b
        LEFT JOIN apartments a ON b.id = a.block_id AND a.is_deleted = 0
        WHERE b.site_id = '1'
        GROUP BY b.id, b.name
        ORDER BY b.name
    """)
    
    blocks = cursor.fetchall()
    for block in blocks:
        print(f"{block['block_name']}:")
        print(f"  Daireler: {block['apartment_count']}")
        print(f"  Malikler: {block['owner_count']}\n")
    
    # Örnek daireler göster
    print("=== ÖRNEK DAİRELER ===\n")
    
    cursor.execute("""
        SELECT 
            a.unit_number,
            b.name as block_name,
            u.full_name as owner_name
        FROM apartments a
        JOIN blocks b ON a.block_id = b.id
        LEFT JOIN users u ON a.owner_user_id = u.id
        WHERE a.site_id = '1' AND a.is_deleted = 0
        ORDER BY CAST(a.unit_number AS UNSIGNED)
        LIMIT 15
    """)
    
    examples = cursor.fetchall()
    
    for ex in examples:
        owner = ex['owner_name'] if ex['owner_name'] else "Boş"
        print(f"Daire {ex['unit_number']} ({ex['block_name']}): {owner}")
    
    cursor.close()
    conn.close()
    
    print("\n✓ İşlem tamamlandı!")

if __name__ == "__main__":
    reassign_residents()
