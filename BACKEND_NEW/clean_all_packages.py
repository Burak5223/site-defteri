#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TÜM paket verilerini temizle - test için
"""
import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor()

print("TÜM PAKET VERİLERİNİ TEMİZLİYORUM...")

# Tüm paketleri sil
cursor.execute("DELETE FROM packages")
print(f"✓ {cursor.rowcount} paket silindi")

# Tüm bildirimleri sil
cursor.execute("DELETE FROM notifications WHERE type LIKE '%PACKAGE%'")
print(f"✓ {cursor.rowcount} bildirim silindi")

conn.commit()
print("\n✓ TAMAM - Şimdi test edebilirsiniz!")

cursor.close()
conn.close()
