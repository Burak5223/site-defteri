import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

# Tamamlanmış oylamayı bul
cursor.execute("SELECT id, title FROM votings WHERE status='completed' LIMIT 1")
result = cursor.fetchone()

if result:
    voting_id, title = result
    print(f"📊 Tamamlanmış oylama: {title} (ID: {voting_id})")
    
    # Seçenekleri kontrol et
    cursor.execute("SELECT COUNT(*) FROM voting_options WHERE voting_id = %s", (voting_id,))
    count = cursor.fetchone()[0]
    
    if count == 0:
        print("   Seçenekler ekleniyor...")
        cursor.execute("""
            INSERT INTO voting_options (voting_id, option_text, display_order) 
            VALUES 
                (%s, 'Evet, havuz yenilensin', 0),
                (%s, 'Hayır, gerek yok', 1),
                (%s, 'Kısmi yenileme yapılsın', 2)
        """, (voting_id, voting_id, voting_id))
        
        # Test için birkaç oy ekle
        cursor.execute("SELECT id FROM voting_options WHERE voting_id = %s ORDER BY display_order", (voting_id,))
        options = cursor.fetchall()
        
        # İlk seçeneğe 5 oy
        for i in range(5):
            cursor.execute("""
                INSERT INTO user_votes (voting_id, option_id, user_id) 
                VALUES (%s, %s, %s)
            """, (voting_id, options[0][0], f'test_user_{i}'))
        
        # İkinci seçeneğe 2 oy
        for i in range(2):
            cursor.execute("""
                INSERT INTO user_votes (voting_id, option_id, user_id) 
                VALUES (%s, %s, %s)
            """, (voting_id, options[1][0], f'test_user_{i+5}'))
        
        # Üçüncü seçeneğe 3 oy
        for i in range(3):
            cursor.execute("""
                INSERT INTO user_votes (voting_id, option_id, user_id) 
                VALUES (%s, %s, %s)
            """, (voting_id, options[2][0], f'test_user_{i+7}'))
        
        conn.commit()
        print("   ✅ 3 seçenek ve 10 test oyu eklendi")
        print("   📊 Sonuçlar: Evet (5), Hayır (2), Kısmi (3)")
    else:
        print(f"   ✅ Zaten {count} seçenek mevcut")

cursor.close()
conn.close()
