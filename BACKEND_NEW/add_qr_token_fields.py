import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)

cursor = conn.cursor()

try:
    # QR token alanlarını ekle (tek tek)
    try:
        cursor.execute("ALTER TABLE packages ADD COLUMN qr_token VARCHAR(36) UNIQUE")
        print("✓ qr_token alanı eklendi")
    except:
        print("- qr_token alanı zaten var")
    
    try:
        cursor.execute("ALTER TABLE packages ADD COLUMN qr_token_created_at TIMESTAMP NULL")
        print("✓ qr_token_created_at alanı eklendi")
    except:
        print("- qr_token_created_at alanı zaten var")
    
    try:
        cursor.execute("ALTER TABLE packages ADD COLUMN qr_token_expires_at TIMESTAMP NULL")
        print("✓ qr_token_expires_at alanı eklendi")
    except:
        print("- qr_token_expires_at alanı zaten var")
    
    try:
        cursor.execute("ALTER TABLE packages ADD COLUMN qr_token_used BOOLEAN DEFAULT FALSE")
        print("✓ qr_token_used alanı eklendi")
    except:
        print("- qr_token_used alanı zaten var")
    
    # Index'leri ekle
    try:
        cursor.execute("CREATE INDEX idx_packages_qr_token ON packages(qr_token)")
        print("✓ qr_token index'i eklendi")
    except:
        print("- qr_token index'i zaten var")
    
    try:
        cursor.execute("CREATE INDEX idx_packages_qr_token_used ON packages(qr_token_used)")
        print("✓ qr_token_used index'i eklendi")
    except:
        print("- qr_token_used index'i zaten var")
    
    conn.commit()
    print("\n✅ Tüm değişiklikler başarıyla uygulandı")
    
except Exception as e:
    print(f"❌ Hata: {e}")
    conn.rollback()
finally:
    cursor.close()
    conn.close()
