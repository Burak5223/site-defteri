import mysql.connector

# Database connection
conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)

cursor = conn.cursor()

# Check if bank account already exists
cursor.execute("SELECT COUNT(*) FROM bank_accounts WHERE site_id = '1'")
count = cursor.fetchone()[0]

if count > 0:
    print("Bank account already exists, updating...")
    cursor.execute("""
        UPDATE bank_accounts 
        SET bank_name = 'Ziraat Bankası',
            branch = 'Merkez Şubesi',
            iban = 'TR00 0000 0000 0000 0000 0000 00',
            account_holder = 'Site Yönetimi A.Ş.',
            is_active = 1
        WHERE site_id = '1'
    """)
else:
    print("Inserting new bank account...")
    # Get the actual site_id value
    cursor.execute("SELECT id FROM sites LIMIT 1")
    site_id = cursor.fetchone()[0]
    print(f"Using site_id: {site_id}")
    
    cursor.execute("""
        INSERT INTO bank_accounts (id, site_id, bank_name, branch, iban, account_holder, is_active)
        VALUES (
            UUID(),
            %s,
            'Ziraat Bankası',
            'Merkez Şubesi',
            'TR00 0000 0000 0000 0000 0000 00',
            'Site Yönetimi A.Ş.',
            1
        )
    """, (site_id,))

conn.commit()
print("Success!")

# Verify
cursor.execute("SELECT * FROM bank_accounts")
accounts = cursor.fetchall()
print(f"\nTotal bank accounts: {len(accounts)}")
for acc in accounts:
    print(f"ID: {acc[0]}, Site: {acc[1]}, Bank: {acc[2]}, IBAN: {acc[4]}")

cursor.close()
conn.close()
