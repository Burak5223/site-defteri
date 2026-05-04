import mysql.connector
import uuid

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

print("\n=== CREATING BLOCKS AND APARTMENTS ===\n")

# 1. Check if block exists for site 2
cursor.execute("SELECT COUNT(*) FROM blocks WHERE site_id = '2'")
block_count = cursor.fetchone()[0]

if block_count == 0:
    print("1. Creating block for site 2...")
    block_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO blocks (id, name, site_id, description)
        VALUES (%s, 'A Blok', '2', 'Ana blok')
    """, (block_id,))
    print(f"   Created block: {block_id}")
else:
    cursor.execute("SELECT id FROM blocks WHERE site_id = '2' LIMIT 1")
    block_id = cursor.fetchone()[0]
    print(f"1. Block already exists: {block_id}")

# 2. Update existing apartments to use this block
print("\n2. Updating apartments to use block...")
cursor.execute("UPDATE apartments SET block_id = %s WHERE site_id = '2'", (block_id,))
print(f"   Updated {cursor.rowcount} apartments")

# 3. Create more apartments if needed
cursor.execute("SELECT COUNT(*) FROM apartments WHERE site_id = '2'")
apt_count = cursor.fetchone()[0]

if apt_count < 10:
    print(f"\n3. Creating more apartments (current: {apt_count})...")
    for i in range(apt_count + 1, 11):
        apt_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO apartments (id, unit_number, floor, block_id, site_id)
            VALUES (%s, %s, %s, %s, '2')
        """, (apt_id, f"A{i}", (i-1)//4 + 1, block_id))
    print(f"   Created {10 - apt_count} apartments")

conn.commit()

# Show results
print("\n=== RESULTS ===\n")

cursor.execute("SELECT COUNT(*) FROM blocks WHERE site_id = '2'")
print(f"Blocks in site 2: {cursor.fetchone()[0]}")

cursor.execute("SELECT COUNT(*) FROM apartments WHERE site_id = '2'")
print(f"Apartments in site 2: {cursor.fetchone()[0]}")

cursor.execute("""
    SELECT a.id, a.unit_number, a.floor, a.block_id
    FROM apartments a
    WHERE a.site_id = '2'
    ORDER BY a.unit_number
    LIMIT 5
""")

print("\nFirst 5 apartments:")
for row in cursor.fetchall():
    apt_id, unit_num, floor, blk_id = row
    print(f"  - {unit_num} | Floor: {floor} | Block: {blk_id[:8]}...")

cursor.close()
conn.close()

print("\n=== DONE ===")
