#!/usr/bin/env python3
"""
Create consistent demo resident occupancy for all non-Yesilvadi sites.

This script intentionally skips Yeşil Vadi Sitesi and only fills other sites
with test residents assigned through residency_history, which is the source
used by the app's apartment/resident screens.
"""
import os
import uuid
from datetime import date, datetime

import bcrypt
import mysql.connector


DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": os.getenv("DB_PASSWORD", "Hilton5252."),
    "database": "smart_site_management",
}

TARGET_RESIDENTS_PER_SITE = 20

FIRST_NAMES = [
    "Ahmet", "Mehmet", "Ayse", "Fatma", "Ali", "Zeynep", "Mustafa", "Elif",
    "Can", "Deniz", "Cem", "Selin", "Burak", "Merve", "Emre", "Esra",
    "Murat", "Gizem", "Kemal", "Burcu",
]

LAST_NAMES = [
    "Yilmaz", "Kaya", "Demir", "Sahin", "Celik", "Yildiz", "Aydin", "Ozturk",
    "Arslan", "Dogan", "Kilic", "Aslan", "Cetin", "Kara", "Koc", "Kurt",
    "Ozdemir", "Simsek", "Aksoy", "Polat",
]


def normalize_slug(value: str) -> str:
    replacements = {
        "ı": "i", "İ": "i", "ğ": "g", "Ğ": "g", "ü": "u", "Ü": "u",
        "ş": "s", "Ş": "s", "ö": "o", "Ö": "o", "ç": "c", "Ç": "c",
    }
    cleaned = "".join(replacements.get(ch, ch) for ch in value.lower())
    return "".join(ch for ch in cleaned if ch.isalnum())


def get_resident_role_id(cursor):
    cursor.execute("""
        SELECT id FROM roles
        WHERE name IN ('ROLE_RESIDENT', 'RESIDENT', 'sakin')
        ORDER BY FIELD(name, 'ROLE_RESIDENT', 'RESIDENT', 'sakin')
        LIMIT 1
    """)
    row = cursor.fetchone()
    if not row:
        raise RuntimeError("Resident role not found in roles table")
    return row["id"]


def ensure_user(cursor, site, index, password_hash):
    site_slug = normalize_slug(site["name"])
    email = f"demo.sakin{index + 1}.{site_slug}@test.com"

    cursor.execute("SELECT * FROM users WHERE email = %s LIMIT 1", (email,))
    user = cursor.fetchone()
    if user:
        return user["id"], False

    user_id = str(uuid.uuid4())
    full_name = f"{FIRST_NAMES[index % len(FIRST_NAMES)]} {LAST_NAMES[index % len(LAST_NAMES)]}"
    phone = f"55{str(abs(hash(site['id'])))[0:3]}{index + 1:05d}"[:20]

    cursor.execute("""
        INSERT INTO users (
            id, full_name, email, phone, site_id, password_hash,
            status, email_verified, phone_verified, preferred_language,
            created_at, updated_at, is_deleted
        ) VALUES (
            %s, %s, %s, %s, %s, %s,
            'aktif', 1, 1, 'tr',
            NOW(), NOW(), 0
        )
    """, (user_id, full_name, email, phone, site["id"], password_hash))

    return user_id, True


def ensure_role(cursor, user_id, role_id, site_id):
    cursor.execute("""
        SELECT id FROM user_roles
        WHERE user_id = %s AND role_id = %s AND (site_id = %s OR site_id IS NULL) AND is_deleted = 0
        LIMIT 1
    """, (user_id, role_id, site_id))
    if cursor.fetchone():
        return False

    cursor.execute("""
        INSERT INTO user_roles (
            id, user_id, role_id, site_id, assigned_at,
            created_at, updated_at, is_deleted
        ) VALUES (%s, %s, %s, %s, NOW(), NOW(), NOW(), 0)
    """, (str(uuid.uuid4()), user_id, role_id, site_id))
    return True


def ensure_membership(cursor, user_id, site_id, index):
    cursor.execute("""
        SELECT id FROM user_site_memberships
        WHERE user_id = %s AND site_id = %s AND is_deleted = 0
        LIMIT 1
    """, (user_id, site_id))
    if cursor.fetchone():
        return False

    user_type = "kat_maliki" if index % 3 == 0 else "kiraci"
    cursor.execute("""
        INSERT INTO user_site_memberships (
            id, user_id, site_id, role_type, user_type, status,
            joined_at, created_at, updated_at, is_deleted
        ) VALUES (%s, %s, %s, 'sakin', %s, 'aktif', CURDATE(), NOW(), NOW(), 0)
    """, (str(uuid.uuid4()), user_id, site_id, user_type))
    return True


def ensure_residency(cursor, user_id, apartment_id, is_owner):
    cursor.execute("""
        SELECT id FROM residency_history
        WHERE user_id = %s AND apartment_id = %s AND status = 'active' AND is_deleted = 0
        LIMIT 1
    """, (user_id, apartment_id))
    if cursor.fetchone():
        return False

    # End any active residency for this user in another apartment outside Yeşilvadi demo flow.
    cursor.execute("""
        UPDATE residency_history
        SET status = 'inactive', move_out_date = CURDATE(), updated_at = NOW()
        WHERE user_id = %s AND status = 'active' AND is_deleted = 0
    """, (user_id,))

    cursor.execute("""
        INSERT INTO residency_history (
            id, apartment_id, user_id, is_owner, move_in_date,
            status, approved_at, created_at, updated_at, is_deleted
        ) VALUES (%s, %s, %s, %s, %s, 'active', NOW(), NOW(), NOW(), 0)
    """, (str(uuid.uuid4()), apartment_id, user_id, 1 if is_owner else 0, date.today()))
    return True


def main():
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)

    role_id = get_resident_role_id(cursor)
    password_hash = bcrypt.hashpw("sakin123".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    cursor.execute("""
        SELECT id, name FROM sites
        WHERE is_deleted = 0 AND name NOT LIKE '%Yeşil%' AND name NOT LIKE '%Yesil%'
        ORDER BY name
    """)
    sites = cursor.fetchall()

    print("=== Non-Yeşilvadi demo resident fix ===")
    print(f"Sites to update: {len(sites)}\n")

    for site in sites:
        cursor.execute("""
            SELECT a.id, a.unit_number, a.block_name
            FROM apartments a
            JOIN blocks b ON b.id = a.block_id
            WHERE b.site_id = %s AND a.is_deleted = 0
            ORDER BY b.name, CAST(a.unit_number AS UNSIGNED), a.unit_number
        """, (site["id"],))
        apartments = cursor.fetchall()

        if not apartments:
            print(f"{site['name']}: no apartments, skipped")
            continue

        target_count = min(TARGET_RESIDENTS_PER_SITE, len(apartments))
        created_users = 0
        created_residencies = 0

        for index in range(target_count):
            user_id, created = ensure_user(cursor, site, index, password_hash)
            created_users += 1 if created else 0
            ensure_role(cursor, user_id, role_id, site["id"])
            ensure_membership(cursor, user_id, site["id"], index)

            apartment = apartments[index]
            is_owner = index % 3 == 0
            if ensure_residency(cursor, user_id, apartment["id"], is_owner):
                created_residencies += 1

            if is_owner:
                cursor.execute("""
                    UPDATE apartments
                    SET owner_user_id = %s, status = 'dolu', updated_at = NOW()
                    WHERE id = %s
                """, (user_id, apartment["id"]))
            else:
                cursor.execute("""
                    UPDATE apartments
                    SET current_resident_id = %s, status = 'dolu', updated_at = NOW()
                    WHERE id = %s
                """, (user_id, apartment["id"]))

        conn.commit()
        print(
            f"{site['name']}: {target_count} apartments seeded, "
            f"{created_users} users created, {created_residencies} residency rows created"
        )

    print("\nSummary after fix:")
    cursor.execute("""
        SELECT s.name,
               COUNT(DISTINCT a.id) apartments,
               COUNT(DISTINCT rh.user_id) active_residents
        FROM sites s
        LEFT JOIN blocks b ON b.site_id = s.id AND b.is_deleted = 0
        LEFT JOIN apartments a ON a.block_id = b.id AND a.is_deleted = 0
        LEFT JOIN residency_history rh ON rh.apartment_id = a.id
            AND rh.status = 'active' AND rh.is_deleted = 0
        WHERE s.is_deleted = 0
        GROUP BY s.id, s.name
        ORDER BY s.name
    """)
    for row in cursor.fetchall():
        print(f"- {row['name']}: {row['apartments']} daire, {row['active_residents']} aktif sakin")

    cursor.close()
    conn.close()


if __name__ == "__main__":
    main()
