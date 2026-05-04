#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Super Admin Rolü ve Kullanıcısı Oluşturma
Tarih: 2026-03-04
"""

import mysql.connector
from mysql.connector import Error
import uuid
from datetime import datetime

# Database bağlantı bilgileri
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'Hilton5252.',
    'database': 'smart_site_management'
}

def create_connection():
    """MySQL bağlantısı oluştur"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        if connection.is_connected():
            print("✓ MySQL bağlantısı başarılı")
            return connection
    except Error as e:
        print(f"✗ Bağlantı hatası: {e}")
        return None

def execute_sql_file(connection, filename):
    """SQL dosyasını çalıştır"""
    try:
        cursor = connection.cursor()
        
        with open(filename, 'r', encoding='utf-8') as file:
            sql_script = file.read()
        
        # SQL komutlarını ayır ve çalıştır
        statements = sql_script.split(';')
        
        for statement in statements:
            statement = statement.strip()
            if statement and not statement.startswith('--'):
                try:
                    cursor.execute(statement)
                    connection.commit()
                except Error as e:
                    # View ve tablo oluşturma hatalarını görmezden gel
                    if 'already exists' not in str(e).lower():
                        print(f"⚠ SQL hatası: {e}")
                        print(f"Statement: {statement[:100]}...")
        
        cursor.close()
        print(f"✓ SQL dosyası çalıştırıldı: {filename}")
        return True
        
    except Error as e:
        print(f"✗ SQL dosyası çalıştırma hatası: {e}")
        return False
    except FileNotFoundError:
        print(f"✗ Dosya bulunamadı: {filename}")
        return False

def verify_super_admin(connection):
    """Super Admin kullanıcısını doğrula"""
    try:
        cursor = connection.cursor(dictionary=True)
        
        # Super Admin kullanıcısını kontrol et
        cursor.execute("""
            SELECT u.id, u.email, u.full_name, u.status,
                   GROUP_CONCAT(r.name) as roles
            FROM users u
            JOIN user_roles ur ON u.id = ur.user_id
            JOIN roles r ON ur.role_id = r.id
            WHERE u.email = 'superadmin@site.com'
            GROUP BY u.id, u.email, u.full_name, u.status
        """)
        
        user = cursor.fetchone()
        
        if user:
            print("\n" + "="*60)
            print("SUPER ADMIN KULLANICI BİLGİLERİ")
            print("="*60)
            print(f"ID: {user['id']}")
            print(f"Email: {user['email']}")
            print(f"Ad Soyad: {user['full_name']}")
            print(f"Roller: {user['roles']}")
            print(f"Durum: {user['status']}")
            print("="*60)
            
            # Dashboard istatistiklerini göster
            cursor.execute("SELECT * FROM super_admin_dashboard")
            stats = cursor.fetchone()
            
            if stats:
                print("\nSUPER ADMIN DASHBOARD İSTATİSTİKLERİ")
                print("="*60)
                print(f"Toplam Site: {stats['total_sites']}")
                print(f"Toplam Yönetici: {stats['total_managers']}")
                print(f"Toplam Sakin: {stats['total_residents']}")
                print(f"Toplam Daire: {stats['total_apartments']}")
                print(f"Aylık Gelir: ₺{stats['monthly_income']:,.2f}")
                print(f"Açık Arızalar: {stats['open_tickets']}")
                print(f"Ödenmemiş Aidatlar: {stats['unpaid_dues']}")
                print(f"Bekleyen Paketler: {stats['waiting_packages']}")
                print("="*60)
            
            # Site istatistiklerini göster
            cursor.execute("SELECT * FROM super_admin_site_stats LIMIT 5")
            sites = cursor.fetchall()
            
            if sites:
                print("\nSİTE İSTATİSTİKLERİ (İlk 5)")
                print("="*60)
                for site in sites:
                    print(f"\n{site['site_name']} ({site['city']})")
                    print(f"  - Daireler: {site['total_apartments']}")
                    print(f"  - Sakinler: {site['total_residents']}")
                    print(f"  - Açık Arızalar: {site['open_tickets']}")
                    print(f"  - Bekleyen Aidatlar: {site['pending_dues']}")
                    print(f"  - Bekleyen Paketler: {site['waiting_packages']}")
                    print(f"  - Yıllık Gelir: ₺{site['yearly_income']:,.2f}")
                print("="*60)
            
            # Performans metrikleri
            cursor.execute("SELECT * FROM super_admin_performance_metrics LIMIT 5")
            metrics = cursor.fetchall()
            
            if metrics:
                print("\nPERFORMANS METRİKLERİ (İlk 5)")
                print("="*60)
                for metric in metrics:
                    print(f"\n{metric['site_name']}")
                    print(f"  - Aidat Tahsilat Oranı: %{metric['due_collection_rate'] or 0:.1f}")
                    print(f"  - Arıza Çözüm Oranı: %{metric['ticket_resolution_rate'] or 0:.1f}")
                    print(f"  - Ort. Çözüm Süresi: {metric['avg_ticket_resolution_days'] or 0:.1f} gün")
                    print(f"  - Paket Teslim Oranı: %{metric['package_delivery_rate'] or 0:.1f}")
                    print(f"  - Doluluk Oranı: %{metric['occupancy_rate'] or 0:.1f}")
                    print(f"  - Performans Skoru: {metric['performance_score'] or 0:.1f}/5.0")
                print("="*60)
            
            return True
        else:
            print("✗ Super Admin kullanıcısı bulunamadı!")
            return False
            
        cursor.close()
        
    except Error as e:
        print(f"✗ Doğrulama hatası: {e}")
        return False

def main():
    """Ana fonksiyon"""
    print("\n" + "="*60)
    print("SUPER ADMIN OLUŞTURMA SCRIPTI")
    print("="*60 + "\n")
    
    # Bağlantı oluştur
    connection = create_connection()
    if not connection:
        return
    
    try:
        # SQL dosyasını çalıştır
        print("\n1. SQL dosyası çalıştırılıyor...")
        if execute_sql_file(connection, 'CREATE_SUPER_ADMIN_ROLE.sql'):
            print("✓ SQL dosyası başarıyla çalıştırıldı")
        else:
            print("✗ SQL dosyası çalıştırılamadı")
            return
        
        # Doğrulama
        print("\n2. Super Admin doğrulanıyor...")
        if verify_super_admin(connection):
            print("\n✓ Super Admin başarıyla oluşturuldu ve doğrulandı!")
            print("\nGİRİŞ BİLGİLERİ:")
            print("Email: superadmin@site.com")
            print("Şifre: 123456")
            print("\n⚠ ÖNEMLİ: İlk girişten sonra şifrenizi değiştirin!")
        else:
            print("\n✗ Super Admin doğrulaması başarısız!")
        
    except Exception as e:
        print(f"\n✗ Beklenmeyen hata: {e}")
    
    finally:
        if connection and connection.is_connected():
            connection.close()
            print("\n✓ Bağlantı kapatıldı")

if __name__ == "__main__":
    main()
