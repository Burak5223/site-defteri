import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

print("Fixing all maintenance_equipment duplicate columns...")

# Fix maintenance_period_days
try:
    cursor.execute("""
        ALTER TABLE maintenance_equipment 
        MODIFY COLUMN maintenance_period_days INT DEFAULT 30
    """)
    print("✓ maintenance_period_days: default value added")
except Exception as e:
    print(f"  maintenance_period_days: {e}")

# Fix name column
try:
    cursor.execute("""
        ALTER TABLE maintenance_equipment 
        MODIFY COLUMN name VARCHAR(200) DEFAULT ''
    """)
    print("✓ name: default value added")
except Exception as e:
    print(f"  name: {e}")

# Fix type column
try:
    cursor.execute("""
        ALTER TABLE maintenance_equipment 
        MODIFY COLUMN type VARCHAR(50) DEFAULT ''
    """)
    print("✓ type: default value added")
except Exception as e:
    print(f"  type: {e}")

# Update NULL values
cursor.execute("""
    UPDATE maintenance_equipment 
    SET maintenance_period_days = COALESCE(maintenance_interval_days, 30)
    WHERE maintenance_period_days IS NULL
""")
print(f"✓ Updated {cursor.rowcount} rows for maintenance_period_days")

cursor.execute("""
    UPDATE maintenance_equipment 
    SET name = COALESCE(equipment_name, '')
    WHERE name IS NULL OR name = ''
""")
print(f"✓ Updated {cursor.rowcount} rows for name")

cursor.execute("""
    UPDATE maintenance_equipment 
    SET type = COALESCE(equipment_type, '')
    WHERE type IS NULL OR type = ''
""")
print(f"✓ Updated {cursor.rowcount} rows for type")

conn.commit()
cursor.close()
conn.close()

print("\n✓ All maintenance columns fixed!")
