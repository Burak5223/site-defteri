import mysql.connector

# Database connection
conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)

cursor = conn.cursor()

# Create bank_accounts table
print("Creating bank_accounts table...")
cursor.execute("""
    CREATE TABLE IF NOT EXISTS bank_accounts (
        id VARCHAR(36) PRIMARY KEY,
        site_id VARCHAR(36) NOT NULL,
        bank_name VARCHAR(100) NOT NULL,
        branch VARCHAR(100),
        iban VARCHAR(34) NOT NULL,
        account_holder VARCHAR(100) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
    )
""")
print("Table created!")

# Insert demo bank account
print("Inserting demo bank account...")
try:
    cursor.execute("""
        INSERT INTO bank_accounts (id, site_id, bank_name, branch, iban, account_holder, is_active, created_at, updated_at)
        VALUES (
            '1',
            1,
            'Ziraat Bankası',
            'Merkez Şubesi',
            'TR00 0000 0000 0000 0000 0000 00',
            'Site Yönetimi A.Ş.',
            1,
            NOW(),
            NOW()
        )
    """)
    conn.commit()
    print("Demo bank account created!")
except Exception as e:
    print(f"Error: {e}")
    print("Trying to update existing record...")
    cursor.execute("""
        UPDATE bank_accounts 
        SET bank_name = 'Ziraat Bankası',
            branch = 'Merkez Şubesi',
            iban = 'TR00 0000 0000 0000 0000 0000 00',
            account_holder = 'Site Yönetimi A.Ş.',
            is_active = 1
        WHERE id = '1'
    """)
    conn.commit()
    print("Bank account updated!")

# Verify
cursor.execute("SELECT * FROM bank_accounts")
accounts = cursor.fetchall()
print(f"\nTotal bank accounts: {len(accounts)}")
for acc in accounts:
    print(f"ID: {acc[0]}, Site: {acc[1]}, Bank: {acc[2]}, IBAN: {acc[4]}")

cursor.close()
conn.close()
