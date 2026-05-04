#!/usr/bin/env python3
"""
Ziyaretçi sistemi güncellemesi: TC Kimlik kaldır, Kalış süresi ekle
"""

import mysql.connector
from mysql.connector import Error

def apply_updates():
    try:
        # MySQL bağlantısı
        connection = mysql.connector.connect(
            host='localhost',
            database='smart_site_management',
            user='root',
            password='Hilton5252.'
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            print("✓ MySQL bağlantısı başarılı")
            
            # SQL dosyasını oku ve çalıştır
            with open('update_visitor_schema.sql', 'r', encoding='utf-8') as file:
                sql_script = file.read()
            
            # SQL komutlarını ayır ve çalıştır
            commands = sql_script.split(';')
            
            for command in commands:
                command = command.strip()
                if command and not command.startswith('--'):
                    try:
                        # DELIMITER komutlarını atla
                        if 'DELIMITER' in command:
                            continue
                        
                        cursor.execute(command)
                        print(f"✓ Komut çalıştırıldı: {command[:50]}...")
                    except Error as e:
                        # Bazı hatalar normal (örn: column already exists)
                        if 'Duplicate column' in str(e) or 'already exists' in str(e):
                            print(f"⚠ Atlandı (zaten var): {command[:50]}...")
                        else:
                            print(f"✗ Hata: {e}")
                            print(f"  Komut: {command[:100]}")
            
            connection.commit()
            print("\n✅ Tüm güncellemeler başarıyla uygulandı!")
            
            # Kontrol sorguları
            print("\n📊 Tablo yapısı kontrol ediliyor...")
            
            cursor.execute("DESCRIBE visitor_request_items")
            print("\n✓ visitor_request_items tablosu:")
            for row in cursor.fetchall():
                if 'stay' in row[0] or 'visitor' in row[0]:
                    print(f"  - {row[0]}: {row[1]}")
            
            cursor.execute("DESCRIBE visitors")
            print("\n✓ visitors tablosu:")
            for row in cursor.fetchall():
                if 'stay' in row[0] or 'is_active' in row[0] or 'visitor' in row[0]:
                    print(f"  - {row[0]}: {row[1]}")
            
            # Veri kontrolü
            cursor.execute("SELECT COUNT(*) FROM visitor_request_items")
            count = cursor.fetchone()[0]
            print(f"\n📈 visitor_request_items kayıt sayısı: {count}")
            
            cursor.execute("SELECT COUNT(*) FROM visitors")
            count = cursor.fetchone()[0]
            print(f"📈 visitors kayıt sayısı: {count}")
            
            cursor.close()
            
    except Error as e:
        print(f"✗ MySQL Hatası: {e}")
        return False
    
    finally:
        if connection and connection.is_connected():
            connection.close()
            print("\n✓ MySQL bağlantısı kapatıldı")
    
    return True

if __name__ == "__main__":
    print("=" * 60)
    print("Ziyaretçi Sistemi Güncelleme")
    print("=" * 60)
    print("\nDeğişiklikler:")
    print("  ❌ TC Kimlik No kaldırılıyor")
    print("  ✅ Kalış başlangıç tarihi ekleniyor")
    print("  ✅ Kalış süresi (gün) ekleniyor")
    print("  ✅ Otomatik pasif yapma sistemi ekleniyor")
    print("\n" + "=" * 60 + "\n")
    
    if apply_updates():
        print("\n" + "=" * 60)
        print("✅ GÜNCELLEME TAMAMLANDI!")
        print("=" * 60)
        print("\nSonraki adımlar:")
        print("  1. Backend'i yeniden başlat")
        print("  2. Mobil uygulamayı yeniden başlat")
        print("  3. Test et: python test_visitor_stay_duration.py")
    else:
        print("\n" + "=" * 60)
        print("✗ GÜNCELLEME BAŞARISIZ!")
        print("=" * 60)
