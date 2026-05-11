#!/usr/bin/env python3
"""
Check real resident count from database
"""

import mysql.connector

try:
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="site_yonetim"
    )
    cursor = conn.cursor()
    
    print("=" * 80)
    print("GERÇEK SAKİN SAYISI KONTROLÜ")
    print("=" * 80)
    
    # 1. user_site_memberships'ten sakin sayısı
    cursor.execute("""
        SELECT COUNT(*) 
        FROM user_site_memberships 
        WHERE role_type = 'sakin' 
        AND is_deleted = FALSE 
        AND status = 'aktif'
    """)
    total_residents = cursor.fetchone()[0]
    print(f"\n1. user_site_memberships (sakin, aktif, not deleted): {total_residents}")
    
    # 2. Site bazında dağılım
    cursor.execute("""
        SELECT 
            s.id,
            s.name,
            COUNT(usm.user_id) as resident_count
        FROM sites s
        LEFT JOIN user_site_memberships usm ON s.id = usm.site_id 
            AND usm.role_type = 'sakin' 
            AND usm.is_deleted = FALSE 
            AND usm.status = 'aktif'
        GROUP BY s.id, s.name
        ORDER BY s.name
    """)
    
    print("\n2. Site bazında dağılım:")
    print("-" * 80)
    site_totals = {}
    for row in cursor.fetchall():
        site_id, site_name, count = row
        site_totals[site_id] = count
        print(f"   Site {site_id} ({site_name}): {count} sakin")
    
    # 3. Dairesi olan sakinler
    cursor.execute("""
        SELECT COUNT(DISTINCT a.current_resident_id)
        FROM apartments a
        INNER JOIN user_site_memberships usm ON a.current_resident_id = usm.user_id
        WHERE a.current_resident_id IS NOT NULL
        AND usm.role_type = 'sakin'
        AND usm.is_deleted = FALSE
        AND usm.status = 'aktif'
    """)
    residents_with_apartments = cursor.fetchone()[0]
    print(f"\n3. Dairesi olan sakinler: {residents_with_apartments}")
    
    # 4. Dairesi olmayan sakinler
    cursor.execute("""
        SELECT 
            u.id,
            u.full_name,
            s.name as site_name
        FROM users u
        INNER JOIN user_site_memberships usm ON u.id = usm.user_id
        INNER JOIN sites s ON usm.site_id = s.id
        LEFT JOIN apartments a ON a.current_resident_id = u.id AND a.site_id = s.id
        WHERE usm.role_type = 'sakin'
        AND usm.is_deleted = FALSE
        AND usm.status = 'aktif'
        AND a.id IS NULL
        ORDER BY s.name, u.full_name
    """)
    
    residents_without_apartments = cursor.fetchall()
    print(f"\n4. Dairesi OLMAYAN sakinler: {len(residents_without_apartments)}")
    if len(residents_without_apartments) > 0:
        print("\n   İlk 10 dairesi olmayan sakin:")
        for i, (user_id, full_name, site_name) in enumerate(residents_without_apartments[:10]):
            print(f"   {i+1}. {full_name} - {site_name} (ID: {user_id})")
    
    # 5. Tüm user_site_memberships kayıtları (role_type'a göre)
    cursor.execute("""
        SELECT 
            role_type,
            COUNT(*) as count
        FROM user_site_memberships
        WHERE is_deleted = FALSE
        AND status = 'aktif'
        GROUP BY role_type
        ORDER BY role_type
    """)
    
    print("\n5. Tüm aktif üyelikler (role_type'a göre):")
    print("-" * 80)
    for row in cursor.fetchall():
        role_type, count = row
        print(f"   {role_type}: {count}")
    
    # 6. Duplicate kontrol
    cursor.execute("""
        SELECT 
            user_id,
            site_id,
            COUNT(*) as count
        FROM user_site_memberships
        WHERE role_type = 'sakin'
        AND is_deleted = FALSE
        AND status = 'aktif'
        GROUP BY user_id, site_id
        HAVING COUNT(*) > 1
    """)
    
    duplicates = cursor.fetchall()
    if len(duplicates) > 0:
        print(f"\n6. UYARI: Duplicate kayıtlar bulundu: {len(duplicates)}")
        for user_id, site_id, count in duplicates:
            print(f"   User {user_id} - Site {site_id}: {count} kayıt")
    else:
        print("\n6. Duplicate kayıt yok ✓")
    
    print("\n" + "=" * 80)
    print("ÖZET")
    print("=" * 80)
    print(f"TOPLAM SAKİN SAYISI: {total_residents}")
    print(f"Dairesi olan: {residents_with_apartments}")
    print(f"Dairesi olmayan: {len(residents_without_apartments)}")
    print("=" * 80)
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"HATA: {e}")
