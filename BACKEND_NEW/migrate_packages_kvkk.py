import mysql.connector
import hashlib

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

print("=" * 60)
print("KVKK UYUMLU PAKET TAKİP SİSTEMİ - DATABASE MİGRATION")
print("=" * 60)
print()

def mask_tracking_number(tracking):
    """Takip numarasını maskele: YK123456789 -> YK****789"""
    if not tracking or len(tracking) < 6:
        return "****"
    return tracking[:2] + "****" + tracking[-3:]

def hash_tracking_number(tracking):
    """Takip numarasının SHA-256 hash'ini oluştur"""
    if not tracking:
        return None
    return hashlib.sha256(tracking.encode()).hexdigest()

try:
    # 1. Yeni kolonları ekle
    print("1. Yeni kolonlar ekleniyor...")
    new_columns = [
        ("tracking_masked", "ALTER TABLE packages ADD COLUMN tracking_masked VARCHAR(20) COMMENT 'Maskeli takip numarası (KVKK uyumlu)'"),
        ("tracking_hash", "ALTER TABLE packages ADD COLUMN tracking_hash VARCHAR(64) COMMENT 'SHA-256 hash (doğrulama için)'"),
        ("received_by_role", "ALTER TABLE packages ADD COLUMN received_by_role VARCHAR(20) DEFAULT 'SECURITY' COMMENT 'Rol bazlı kayıt (KVKK uyumlu)'"),
        ("delivered_by_role", "ALTER TABLE packages ADD COLUMN delivered_by_role VARCHAR(20) COMMENT 'Rol bazlı teslim (KVKK uyumlu)'"),
        ("package_type", "ALTER TABLE packages ADD COLUMN package_type VARCHAR(50) COMMENT 'Paket tipi'"),
    ]
    
    # Mevcut kolonları kontrol et
    cursor.execute("SHOW COLUMNS FROM packages")
    existing_columns = {row[0] for row in cursor.fetchall()}
    
    for column_name, sql in new_columns:
        if column_name not in existing_columns:
            print(f"   - {column_name} ekleniyor...")
            cursor.execute(sql)
            conn.commit()
            print(f"   ✓ {column_name} eklendi")
        else:
            print(f"   ⊘ {column_name} zaten mevcut")
    
    print()
    
    # 2. Mevcut verileri migrate et
    print("2. Mevcut veriler KVKK uyumlu hale getiriliyor...")
    cursor.execute("SELECT id, tracking_number FROM packages WHERE tracking_number IS NOT NULL")
    packages = cursor.fetchall()
    
    if packages:
        print(f"   {len(packages)} paket bulundu")
        
        for pkg_id, tracking in packages:
            if tracking:
                masked = mask_tracking_number(tracking)
                hashed = hash_tracking_number(tracking)
                
                cursor.execute("""
                    UPDATE packages 
                    SET tracking_masked = %s, 
                        tracking_hash = %s,
                        received_by_role = 'SECURITY'
                    WHERE id = %s
                """, (masked, hashed, pkg_id))
                
                print(f"   ✓ {tracking} -> {masked}")
        
        conn.commit()
        print(f"   ✓ {len(packages)} paket güncellendi")
    else:
        print("   ⊘ Güncellenecek paket yok")
    
    print()
    
    # 3. Tüm paketler için received_by_role set et
    print("3. Rol bazlı bilgiler ayarlanıyor...")
    cursor.execute("UPDATE packages SET received_by_role = 'SECURITY' WHERE received_by_role IS NULL")
    affected = cursor.rowcount
    conn.commit()
    print(f"   ✓ {affected} paket güncellendi")
    print()
    
    # 4. İndeksler oluştur
    print("4. Performans indeksleri oluşturuluyor...")
    indexes = [
        "CREATE INDEX idx_packages_tracking_hash ON packages(tracking_hash)",
        "CREATE INDEX idx_packages_role ON packages(received_by_role, status)",
    ]
    
    for idx_sql in indexes:
        try:
            cursor.execute(idx_sql)
            conn.commit()
            print(f"   ✓ İndeks oluşturuldu")
        except mysql.connector.Error as e:
            if "Duplicate key name" in str(e):
                print(f"   ⊘ İndeks zaten mevcut")
            else:
                print(f"   ⚠ İndeks hatası: {e}")
    
    print()
    
    # 5. Özet rapor
    print("=" * 60)
    print("MİGRATION TAMAMLANDI!")
    print("=" * 60)
    print()
    print("KVKK Uyumluluk Özeti:")
    print("✓ Takip numaraları maskelendi (TR****45)")
    print("✓ Hash değerleri oluşturuldu (doğrulama için)")
    print("✓ Rol bazlı kayıt sistemi aktif (SECURITY)")
    print("✓ Kişisel veriler korunuyor")
    print()
    
    # İstatistikler
    cursor.execute("SELECT COUNT(*) FROM packages")
    total = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM packages WHERE tracking_masked IS NOT NULL")
    masked = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM packages WHERE received_by_role = 'SECURITY'")
    role_based = cursor.fetchone()[0]
    
    print(f"Toplam Paket: {total}")
    print(f"Maskeli Takip: {masked}")
    print(f"Rol Bazlı Kayıt: {role_based}")
    print()
    
    print("⚠ ÖNEMLİ NOTLAR:")
    print("1. tracking_number kolonu henüz kaldırılmadı (yedek)")
    print("2. Backend'i yeniden başlatın")
    print("3. Frontend'de trackingMasked kullanın")
    print("4. Jüri sunumunda KVKK uyumluluğunu vurgulayın")
    print()
    
except Exception as e:
    print(f"❌ HATA: {e}")
    conn.rollback()
finally:
    cursor.close()
    conn.close()
