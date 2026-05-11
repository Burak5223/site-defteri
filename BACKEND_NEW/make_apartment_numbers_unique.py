import mysql.connector
from mysql.connector import Error

def connect_db():
    return mysql.connector.connect(
        host='localhost',
        user='root',
        password='Hilton5252.',
        database='smart_site_management'
    )

def make_apartment_numbers_unique():
    try:
        conn = connect_db()
        cursor = conn.cursor(dictionary=True)
        
        print("=== MEVCUT DAIRE DURUMU ===")
        cursor.execute("""
            SELECT a.id, a.unit_number, a.block_id, b.name as block_name, a.site_id
            FROM apartments a
            LEFT JOIN blocks b ON a.block_id = b.id
            WHERE a.is_deleted = 0
            ORDER BY a.site_id, b.name, CAST(a.unit_number AS UNSIGNED)
        """)
        apartments = cursor.fetchall()
        
        for apt in apartments:
            print(f"Daire: {apt['unit_number']}, Blok: {apt['block_name']}, Site: {apt['site_id']}")
        
        print(f"\nToplam {len(apartments)} daire bulundu")
        
        # Site bazında yeniden numaralandır
        print("\n=== DAIRE NUMARALARINI YENİDEN DÜZENLEME ===")
        
        cursor.execute("SELECT DISTINCT site_id FROM apartments WHERE is_deleted = 0")
        sites = cursor.fetchall()
        
        for site in sites:
            site_id = site['site_id']
            site_display = site_id if site_id else "(boş site_id)"
            print(f"\nSite {site_display} için daireler yeniden numaralandırılıyor...")
            
            # Bu site için tüm daireleri al (blok sırasına göre)
            if site_id:
                cursor.execute("""
                    SELECT a.id, a.unit_number, a.block_id, b.name as block_name
                    FROM apartments a
                    LEFT JOIN blocks b ON a.block_id = b.id
                    WHERE a.site_id = %s AND a.is_deleted = 0
                    ORDER BY b.name, CAST(a.unit_number AS UNSIGNED)
                """, (site_id,))
            else:
                cursor.execute("""
                    SELECT a.id, a.unit_number, a.block_id, b.name as block_name
                    FROM apartments a
                    LEFT JOIN blocks b ON a.block_id = b.id
                    WHERE (a.site_id IS NULL OR a.site_id = '') AND a.is_deleted = 0
                    ORDER BY b.name, CAST(a.unit_number AS UNSIGNED)
                """)
            
            site_apartments = cursor.fetchall()
            
            # Yeni numara ata
            new_number = 1
            for apt in site_apartments:
                old_number = apt['unit_number']
                cursor.execute("""
                    UPDATE apartments 
                    SET unit_number = %s 
                    WHERE id = %s
                """, (str(new_number), apt['id']))
                
                print(f"  Blok {apt['block_name']}: Daire {old_number} -> {new_number}")
                new_number += 1
        
        conn.commit()
        
        print("\n=== YENİ DAIRE DURUMU ===")
        cursor.execute("""
            SELECT a.id, a.unit_number, a.block_id, b.name as block_name, a.site_id
            FROM apartments a
            LEFT JOIN blocks b ON a.block_id = b.id
            WHERE a.is_deleted = 0
            ORDER BY a.site_id, CAST(a.unit_number AS UNSIGNED)
        """)
        apartments = cursor.fetchall()
        
        for apt in apartments:
            print(f"Daire: {apt['unit_number']}, Blok: {apt['block_name']}, Site: {apt['site_id']}")
        
        # Unique constraint ekle
        print("\n=== UNIQUE CONSTRAINT EKLEME ===")
        try:
            # Önce varsa eski constraint'i kaldır
            cursor.execute("""
                SELECT CONSTRAINT_NAME 
                FROM information_schema.TABLE_CONSTRAINTS 
                WHERE TABLE_SCHEMA = 'site_management' 
                AND TABLE_NAME = 'apartments' 
                AND CONSTRAINT_TYPE = 'UNIQUE'
                AND CONSTRAINT_NAME LIKE '%unit_number%'
            """)
            constraints = cursor.fetchall()
            
            for constraint in constraints:
                print(f"Eski constraint kaldırılıyor: {constraint['CONSTRAINT_NAME']}")
                cursor.execute(f"ALTER TABLE apartments DROP INDEX {constraint['CONSTRAINT_NAME']}")
            
            # Yeni unique constraint ekle (site_id + unit_number)
            cursor.execute("""
                ALTER TABLE apartments 
                ADD UNIQUE KEY unique_unit_per_site (site_id, unit_number)
            """)
            print("✓ Unique constraint eklendi: Her site için daire numaraları unique olacak")
            
            conn.commit()
            
        except Error as e:
            if "Duplicate entry" in str(e):
                print(f"⚠ Hala duplicate kayıtlar var: {e}")
            else:
                print(f"Constraint eklenirken hata: {e}")
        
        print("\n✓ İşlem tamamlandı!")
        
        cursor.close()
        conn.close()
        
    except Error as e:
        print(f"Hata: {e}")

if __name__ == "__main__":
    make_apartment_numbers_unique()
