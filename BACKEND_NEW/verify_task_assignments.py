#!/usr/bin/env python3
"""
Görev atamalarını ve dashboard verilerini doğrulama
"""

import mysql.connector
from datetime import datetime

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor()

print("=" * 80)
print("GÖREV ATAMA DOĞRULAMA")
print("=" * 80)

# 1. Kullanıcıları kontrol et
print("\n1. KULLANICILAR:")
cursor.execute("""
    SELECT id, full_name, email, site_id 
    FROM users 
    WHERE email IN ('guvenlik@site.com', 'temizlik@site.com') 
    AND is_deleted = 0
""")
users = cursor.fetchall()

user_map = {}
for user in users:
    user_map[user[0]] = user
    print(f"   • {user[1]} ({user[2]}) - Site ID: {user[3]}")

# 2. Görevleri kontrol et
print("\n2. ATANAN GÖREVLER:")
for user_id, user_info in user_map.items():
    cursor.execute("""
        SELECT id, title, task_type, status, due_date, created_at
        FROM tasks 
        WHERE assigned_to = %s AND is_deleted = 0
        ORDER BY created_at DESC
    """, (user_id,))
    tasks = cursor.fetchall()
    
    print(f"\n   {user_info[1]} ({user_info[2]}):")
    print(f"   Toplam: {len(tasks)} görev")
    
    # Durum bazında sayılar
    status_counts = {}
    for task in tasks:
        status = task[3]
        status_counts[status] = status_counts.get(status, 0) + 1
    
    for status, count in status_counts.items():
        print(f"      - {status}: {count} görev")
    
    # Bugünkü görevler
    today = datetime.now().date()
    today_tasks = [t for t in tasks if (t[4].date() if isinstance(t[4], datetime) else t[4]) == today]
    print(f"      - Bugünkü görevler: {len(today_tasks)}")
    
    # Son 3 görevi göster
    print(f"\n   Son görevler:")
    for task in tasks[:3]:
        due_date_str = task[4].strftime('%Y-%m-%d') if isinstance(task[4], datetime) else str(task[4])
        print(f"      • {task[1]} - {task[3]} (Bitiş: {due_date_str})")

# 3. Dashboard istatistikleri
print("\n3. DASHBOARD İSTATİSTİKLERİ:")
for user_id, user_info in user_map.items():
    print(f"\n   {user_info[1]} için:")
    
    # Toplam görevler
    cursor.execute("""
        SELECT COUNT(*) FROM tasks 
        WHERE assigned_to = %s AND is_deleted = 0
    """, (user_id,))
    total = cursor.fetchone()[0]
    print(f"      Toplam görev: {total}")
    
    # Devam eden görevler
    cursor.execute("""
        SELECT COUNT(*) FROM tasks 
        WHERE assigned_to = %s AND status = 'devam_ediyor' AND is_deleted = 0
    """, (user_id,))
    ongoing = cursor.fetchone()[0]
    print(f"      Devam eden: {ongoing}")
    
    # Tamamlanan görevler
    cursor.execute("""
        SELECT COUNT(*) FROM tasks 
        WHERE assigned_to = %s AND status = 'tamamlandi' AND is_deleted = 0
    """, (user_id,))
    completed = cursor.fetchone()[0]
    print(f"      Tamamlanan: {completed}")
    
    # Bekleyen görevler
    cursor.execute("""
        SELECT COUNT(*) FROM tasks 
        WHERE assigned_to = %s AND status = 'bekliyor' AND is_deleted = 0
    """, (user_id,))
    pending = cursor.fetchone()[0]
    print(f"      Bekleyen: {pending}")
    
    # Bugünkü görevler
    cursor.execute("""
        SELECT COUNT(*) FROM tasks 
        WHERE assigned_to = %s 
        AND DATE(due_date) = CURDATE() 
        AND is_deleted = 0
    """, (user_id,))
    today_count = cursor.fetchone()[0]
    print(f"      Bugünkü görevler: {today_count}")

print("\n" + "=" * 80)
print("✓ Doğrulama tamamlandı!")
print("=" * 80)

cursor.close()
conn.close()
