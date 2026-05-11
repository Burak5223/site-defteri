import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

print("Fixing maintenance_period_days column...")

# Add default value to column
try:
    cursor.execute("""
        ALTER TABLE maintenance_equipment 
        MODIFY COLUMN maintenance_period_days INT DEFAULT 30
    """)
    print("✓ Default value added to maintenance_period_days column")
except Exception as e:
    print(f"Note: {e}")

# Update existing NULL values
cursor.execute("""
    UPDATE maintenance_equipment 
    SET maintenance_period_days = maintenance_interval_days 
    WHERE maintenance_period_days IS NULL
""")
print(f"✓ Updated {cursor.rowcount} rows with NULL maintenance_period_days")

conn.commit()
cursor.close()
conn.close()

print("\n✓ Maintenance period days column fixed!")
