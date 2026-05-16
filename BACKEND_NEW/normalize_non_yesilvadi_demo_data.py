#!/usr/bin/env python3
"""
Normalize demo data for every site except Yesil Vadi.

The script keeps Yesil Vadi untouched, then makes all other sites use exactly
A/B/C blocks, distributes apartments across those blocks, and fills every
apartment with at least one active resident. Some apartments also get tenants.
"""
import os
import re
import uuid
from datetime import date

import bcrypt
import mysql.connector


DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": os.getenv("DB_PASSWORD", "Hilton5252."),
    "database": "smart_site_management",
}

BLOCK_NAMES = ["A", "B", "C"]
PASSWORD_HASH = bcrypt.hashpw("sakin123".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

FIRST_NAMES = [
    "Ahmet", "Mehmet", "Ayse", "Fatma", "Ali", "Zeynep", "Mustafa", "Elif",
    "Can", "Deniz", "Cem", "Selin", "Burak", "Merve", "Emre", "Esra",
    "Murat", "Gizem", "Kemal", "Burcu", "Serkan", "Derya", "Onur", "Ece",
]

LAST_NAMES = [
    "Yilmaz", "Kaya", "Demir", "Sahin", "Celik", "Yildiz", "Aydin", "Ozturk",
    "Arslan", "Dogan", "Kilic", "Aslan", "Cetin", "Kara", "Koc", "Kurt",
    "Ozdemir", "Simsek", "Aksoy", "Polat", "Erdem", "Gunes", "Tan", "Uslu",
]


def slug(value):
    replacements = str.maketrans({
        "ı": "i", "İ": "i", "ğ": "g", "Ğ": "g", "ü": "u", "Ü": "u",
        "ş": "s", "Ş": "s", "ö": "o", "Ö": "o", "ç": "c", "Ç": "c",
    })
    cleaned = value.translate(replacements).lower()
    return re.sub(r"[^a-z0-9]+", "", cleaned) or "site"


def is_yesilvadi(site):
    normalized = slug(site["name"])
    return site["id"] == "1" or "yesil" in normalized or "vadi" in normalized


def resident_role_id(cursor):
    cursor.execute("""
        SELECT id FROM roles
        WHERE name IN ('ROLE_RESIDENT', 'RESIDENT', 'Sakin')
        ORDER BY FIELD(name, 'ROLE_RESIDENT', 'RESIDENT', 'Sakin')
        LIMIT 1
    """)
    row = cursor.fetchone()
    if not row:
        raise RuntimeError("Resident role not found")
    return row["id"]


def ensure_block(cursor, site_id, name):
    cursor.execute("""
        SELECT id FROM blocks
        WHERE site_id = %s AND name = %s AND is_deleted = 0
        ORDER BY created_at ASC
        LIMIT 1
    """, (site_id, name))
    row = cursor.fetchone()
    if row:
        return row["id"]

    block_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO blocks (
            id, site_id, name, description, total_floors,
            created_at, updated_at, is_deleted
        ) VALUES (%s, %s, %s, %s, 10, NOW(), NOW(), 0)
    """, (block_id, site_id, name, f"{name} Blok"))
    return block_id


def normalize_blocks(cursor, site_id):
    block_ids = {name: ensure_block(cursor, site_id, name) for name in BLOCK_NAMES}

    cursor.execute("""
        SELECT id FROM blocks
        WHERE site_id = %s AND is_deleted = 0
          AND (name NOT IN ('A', 'B', 'C') OR id NOT IN (%s, %s, %s))
    """, (site_id, block_ids["A"], block_ids["B"], block_ids["C"]))
    extra_block_ids = [row["id"] for row in cursor.fetchall()]

    if extra_block_ids:
        placeholders = ",".join(["%s"] * len(extra_block_ids))
        cursor.execute(
            f"UPDATE blocks SET is_deleted = 1, deleted_at = NOW(), updated_at = NOW() "
            f"WHERE id IN ({placeholders})",
            extra_block_ids,
        )

    return block_ids


def user_phone(site_index, apt_index, suffix):
    return f"55{site_index + 10:02d}{apt_index + 1:04d}{suffix:02d}"[:20]


def ensure_user(cursor, site, site_index, apt_index, resident_kind, suffix):
    site_slug = slug(site["name"])
    email = f"demo.{resident_kind}{apt_index + 1}.{site_slug}@test.com"
    cursor.execute("SELECT id FROM users WHERE email = %s LIMIT 1", (email,))
    row = cursor.fetchone()
    if row:
        cursor.execute("""
            UPDATE users
            SET site_id = %s, status = 'aktif', is_deleted = 0, updated_at = NOW()
            WHERE id = %s
        """, (site["id"], row["id"]))
        return row["id"]

    user_id = str(uuid.uuid4())
    first = FIRST_NAMES[(apt_index + suffix) % len(FIRST_NAMES)]
    last = LAST_NAMES[(apt_index * 3 + suffix) % len(LAST_NAMES)]
    label = "Kiraci" if resident_kind == "kiraci" else "Malik"
    cursor.execute("""
        INSERT INTO users (
            id, full_name, email, phone, site_id, password_hash,
            status, email_verified, phone_verified, preferred_language,
            created_at, updated_at, is_deleted
        ) VALUES (%s, %s, %s, %s, %s, %s, 'aktif', 1, 1, 'tr', NOW(), NOW(), 0)
    """, (
        user_id,
        f"{first} {last} {label}",
        email,
        user_phone(site_index, apt_index, suffix),
        site["id"],
        PASSWORD_HASH,
    ))
    return user_id


def ensure_role(cursor, user_id, role_id, site_id):
    cursor.execute("""
        SELECT id FROM user_roles
        WHERE user_id = %s AND role_id = %s AND site_id = %s AND is_deleted = 0
        LIMIT 1
    """, (user_id, role_id, site_id))
    if cursor.fetchone():
        return

    cursor.execute("""
        INSERT INTO user_roles (
            id, user_id, role_id, site_id, assigned_at,
            created_at, updated_at, is_deleted
        ) VALUES (%s, %s, %s, %s, NOW(), NOW(), NOW(), 0)
    """, (str(uuid.uuid4()), user_id, role_id, site_id))


def ensure_membership(cursor, user_id, site_id, user_type):
    cursor.execute("""
        SELECT id FROM user_site_memberships
        WHERE user_id = %s AND site_id = %s
        LIMIT 1
    """, (user_id, site_id))
    row = cursor.fetchone()
    if row:
        cursor.execute("""
            UPDATE user_site_memberships
            SET role_type = 'sakin', user_type = %s, status = 'aktif',
                left_at = NULL, is_deleted = 0, updated_at = NOW()
            WHERE id = %s
        """, (user_type, row["id"]))
        return

    cursor.execute("""
        INSERT INTO user_site_memberships (
            id, user_id, site_id, role_type, user_type, status,
            joined_at, created_at, updated_at, is_deleted
        ) VALUES (%s, %s, %s, 'sakin', %s, 'aktif', CURDATE(), NOW(), NOW(), 0)
    """, (str(uuid.uuid4()), user_id, site_id, user_type))


def ensure_active_residency(cursor, user_id, apartment_id, is_owner):
    cursor.execute("""
        UPDATE residency_history
        SET status = 'inactive', move_out_date = CURDATE(), updated_at = NOW()
        WHERE user_id = %s AND apartment_id <> %s
          AND status = 'active' AND is_deleted = 0
    """, (user_id, apartment_id))

    cursor.execute("""
        SELECT id FROM residency_history
        WHERE user_id = %s AND apartment_id = %s AND is_deleted = 0
        LIMIT 1
    """, (user_id, apartment_id))
    row = cursor.fetchone()
    if row:
        cursor.execute("""
            UPDATE residency_history
            SET is_owner = %s, status = 'active', move_out_date = NULL,
                move_in_date = COALESCE(move_in_date, %s), updated_at = NOW()
            WHERE id = %s
        """, (1 if is_owner else 0, date.today(), row["id"]))
        return

    cursor.execute("""
        INSERT INTO residency_history (
            id, apartment_id, user_id, is_owner, move_in_date,
            status, approved_at, created_at, updated_at, is_deleted
        ) VALUES (%s, %s, %s, %s, %s, 'active', NOW(), NOW(), NOW(), 0)
    """, (str(uuid.uuid4()), apartment_id, user_id, 1 if is_owner else 0, date.today()))


def normalize_apartments(cursor, site, site_index, block_ids, role_id):
    cursor.execute("""
        SELECT a.id
        FROM apartments a
        WHERE a.site_id = %s AND a.is_deleted = 0
        ORDER BY CAST(a.unit_number AS UNSIGNED), a.unit_number, a.created_at, a.id
    """, (site["id"],))
    apartments = cursor.fetchall()

    if apartments:
        apartment_ids = [apartment["id"] for apartment in apartments]
        placeholders = ",".join(["%s"] * len(apartment_ids))
        cursor.execute(
            f"""
            UPDATE residency_history
            SET status = 'inactive', move_out_date = CURDATE(), updated_at = NOW()
            WHERE apartment_id IN ({placeholders})
              AND status = 'active' AND is_deleted = 0
            """,
            apartment_ids,
        )

    for index, apartment in enumerate(apartments):
        cursor.execute(
            "UPDATE apartments SET unit_number = %s, updated_at = NOW() WHERE id = %s",
            (f"TMP-{index + 1}", apartment["id"]),
        )

    for index, apartment in enumerate(apartments):
        block_name = BLOCK_NAMES[index % len(BLOCK_NAMES)]
        block_id = block_ids[block_name]
        unit_number = str(index + 1)
        floor = (index // len(BLOCK_NAMES)) + 1

        owner_id = ensure_user(cursor, site, site_index, index, "malik", 1)
        ensure_role(cursor, owner_id, role_id, site["id"])
        ensure_membership(cursor, owner_id, site["id"], "kat_maliki")
        ensure_active_residency(cursor, owner_id, apartment["id"], True)

        tenant_id = None
        if index % 4 == 1:
            tenant_id = ensure_user(cursor, site, site_index, index, "kiraci", 2)
            ensure_role(cursor, tenant_id, role_id, site["id"])
            ensure_membership(cursor, tenant_id, site["id"], "kiraci")
            ensure_active_residency(cursor, tenant_id, apartment["id"], False)

        cursor.execute("""
            UPDATE apartments
            SET block_id = %s, block_name = %s, unit_number = %s, floor = %s,
                owner_user_id = %s, current_resident_id = %s,
                status = 'dolu', updated_at = NOW()
            WHERE id = %s
        """, (
            block_id,
            block_name,
            unit_number,
            floor,
            owner_id,
            tenant_id or owner_id,
            apartment["id"],
        ))

    return len(apartments)


def main():
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)
    role_id = resident_role_id(cursor)

    cursor.execute("SELECT id, name FROM sites WHERE is_deleted = 0 ORDER BY name")
    sites = [site for site in cursor.fetchall() if not is_yesilvadi(site)]

    print("=== Normalize non-Yesilvadi demo data ===")
    print(f"Sites to update: {len(sites)}")

    for site_index, site in enumerate(sites):
        block_ids = normalize_blocks(cursor, site["id"])
        apartment_count = normalize_apartments(cursor, site, site_index, block_ids, role_id)
        conn.commit()
        print(f"- {site['name']}: A/B/C bloklari ayarlandi, {apartment_count} daire dolduruldu")

    print("\nSummary:")
    cursor.execute("""
        SELECT s.name, b.name block_name,
               COUNT(DISTINCT a.id) apartments,
               COUNT(DISTINCT rh.user_id) residents,
               SUM(CASE WHEN rh.is_owner = 0 THEN 1 ELSE 0 END) tenants
        FROM sites s
        JOIN blocks b ON b.site_id = s.id AND b.is_deleted = 0
        LEFT JOIN apartments a ON a.block_id = b.id AND a.is_deleted = 0
        LEFT JOIN residency_history rh ON rh.apartment_id = a.id
            AND rh.status = 'active' AND rh.is_deleted = 0
        WHERE s.is_deleted = 0
        GROUP BY s.id, s.name, b.id, b.name
        ORDER BY s.name, b.name
    """)
    for row in cursor.fetchall():
        print(
            f"{row['name']} / {row['block_name']}: "
            f"{row['apartments']} daire, {row['residents']} sakin, {row['tenants'] or 0} kiraci"
        )

    cursor.close()
    conn.close()


if __name__ == "__main__":
    main()
