import mysql.connector

# Veritabanı bağlantısı
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

print("🔍 Mevcut oylamalar ve seçenekleri kontrol ediliyor...\n")

# Oylamaları getir
cursor.execute("SELECT id, title FROM votings WHERE status = 'active' ORDER BY id")
votings = cursor.fetchall()

for voting_id, title in votings:
    print(f"📊 Oylama ID: {voting_id}, Başlık: {title}")
    
    # Bu oylamanın seçeneklerini kontrol et
    cursor.execute("SELECT id, option_text FROM voting_options WHERE voting_id = %s", (voting_id,))
    options = cursor.fetchall()
    
    if len(options) == 0:
        print(f"   ⚠️  Seçenek yok! Seçenekler ekleniyor...")
        
        # Oylamaya göre uygun seçenekler ekle
        if "Oyun Parkı" in title:
            new_options = [
                ("Evet, oyun parkı yapılsın", 0),
                ("Hayır, gerek yok", 1),
                ("Farklı bir proje yapılsın", 2)
            ]
        elif "Güvenlik Kamerası" in title or "Kamera" in title:
            new_options = [
                ("Evet, kameralar eklensin", 0),
                ("Hayır, mevcut kameralar yeterli", 1),
                ("Daha fazla kamera eklensin", 2)
            ]
        else:
            new_options = [
                ("Evet", 0),
                ("Hayır", 1),
                ("Kararsızım", 2)
            ]
        
        for option_text, display_order in new_options:
            cursor.execute("""
                INSERT INTO voting_options (voting_id, option_text, display_order)
                VALUES (%s, %s, %s)
            """, (voting_id, option_text, display_order))
            print(f"      ✅ Eklendi: {option_text}")
        
        conn.commit()
    else:
        print(f"   ✅ {len(options)} seçenek mevcut:")
        for opt_id, opt_text in options:
            # Oy sayısını kontrol et
            cursor.execute("SELECT COUNT(*) FROM user_votes WHERE voting_id = %s AND option_id = %s", 
                          (voting_id, opt_id))
            vote_count = cursor.fetchone()[0]
            print(f"      - {opt_text} ({vote_count} oy)")
    print()

print("\n✅ Tüm oylamalar kontrol edildi ve eksik seçenekler eklendi!")

cursor.close()
conn.close()
