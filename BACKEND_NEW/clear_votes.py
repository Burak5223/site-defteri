import mysql.connector

# Veritabanı bağlantısı
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

# Tüm oyları temizle
cursor.execute("DELETE FROM user_votes")
conn.commit()

print(f"✅ {cursor.rowcount} oy silindi")

# Oylamaları kontrol et
cursor.execute("SELECT id, title, site_id, status FROM votings ORDER BY created_at DESC")
votings = cursor.fetchall()

print(f"\n📊 Toplam {len(votings)} oylama var:")
for voting in votings:
    print(f"  - ID: {voting[0]}, Başlık: {voting[1]}, Site: {voting[2]}, Durum: {voting[3]}")

# Seçenekleri kontrol et
cursor.execute("""
    SELECT vo.id, vo.voting_id, vo.option_text, v.title 
    FROM voting_options vo
    JOIN votings v ON vo.voting_id = v.id
    ORDER BY vo.voting_id, vo.display_order
""")
options = cursor.fetchall()

print(f"\n📋 Toplam {len(options)} seçenek var:")
for opt in options:
    print(f"  - Oylama: {opt[3]}, Seçenek: {opt[2]}")

cursor.close()
conn.close()
