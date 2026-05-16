import requests
import json

BASE_URL = "http://localhost:8080/api"

# Test kullanıcıları
USERS = {
    "admin": {"email": "admin@site.com", "password": "admin123"},
    "sakin": {"email": "sakin@site.com", "password": "sakin123"},
    "security": {"email": "security@site.com", "password": "security123"},
}

def login(email, password):
    """Kullanıcı girişi yap ve token al"""
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": email,
        "password": password
    })
    if response.status_code == 200:
        data = response.json()
        return data.get('accessToken') or data.get('token')
    else:
        print(f"❌ Login failed for {email}: {response.status_code}")
        print(response.text)
        return None

def get_votings(token, site_id="1"):
    """Oylamaları getir"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/sites/{site_id}/voting", headers=headers)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"❌ Get votings failed: {response.status_code}")
        print(response.text)
        return []

def create_voting(token, site_id="1"):
    """Yeni oylama oluştur"""
    headers = {"Authorization": f"Bearer {token}"}
    
    voting_data = {
        "title": "Test Oylama - Site Bahçe Düzenlemesi",
        "description": "Site bahçesine yeni çiçekler dikilmesi konusunda oyunuzu kullanın",
        "startDate": "2026-05-13T10:00:00",
        "endDate": "2026-06-13T23:59:59",
        "options": [
            "Evet, çiçekler dikilsin",
            "Hayır, gerek yok",
            "Farklı bir düzenleme yapılsın"
        ]
    }
    
    response = requests.post(
        f"{BASE_URL}/sites/{site_id}/e-voting",
        headers=headers,
        json=voting_data
    )
    
    if response.status_code in [200, 201]:
        print("✅ Oylama oluşturuldu")
        return response.json()
    else:
        print(f"❌ Create voting failed: {response.status_code}")
        print(response.text)
        return None

def cast_vote(token, voting_id, option_id):
    """Oy kullan"""
    headers = {"Authorization": f"Bearer {token}"}
    
    vote_data = {
        "votingId": voting_id,
        "optionId": option_id
    }
    
    response = requests.post(
        f"{BASE_URL}/e-voting/vote",
        headers=headers,
        json=vote_data
    )
    
    if response.status_code in [200, 201]:
        print("✅ Oy kullanıldı")
        return True
    else:
        print(f"❌ Cast vote failed: {response.status_code}")
        print(response.text)
        return False

def print_voting_details(voting):
    """Oylama detaylarını yazdır"""
    print(f"\n{'='*60}")
    print(f"📊 Oylama: {voting.get('title')}")
    print(f"   Açıklama: {voting.get('description')}")
    print(f"   Durum: {voting.get('status')}")
    print(f"   Toplam Oy: {voting.get('totalVotes', 0)}")
    print(f"   Bitiş: {voting.get('endDate')}")
    
    if 'options' in voting:
        print(f"\n   Seçenekler:")
        for opt in voting['options']:
            percentage = 0
            if voting.get('totalVotes', 0) > 0:
                percentage = (opt.get('voteCount', 0) / voting['totalVotes']) * 100
            print(f"   - {opt.get('optionText')}: {opt.get('voteCount', 0)} oy ({percentage:.1f}%)")
    print(f"{'='*60}\n")

def main():
    print("🔍 E-OYLAMA SİSTEMİ TEST\n")
    
    # 1. Admin girişi
    print("1️⃣ Admin girişi yapılıyor...")
    admin_token = login(USERS["admin"]["email"], USERS["admin"]["password"])
    if not admin_token:
        print("❌ Admin girişi başarısız!")
        return
    print("✅ Admin girişi başarılı\n")
    
    # 2. Mevcut oylamaları kontrol et
    print("2️⃣ Mevcut oylamalar kontrol ediliyor...")
    votings = get_votings(admin_token)
    print(f"✅ {len(votings)} oylama bulundu\n")
    
    for voting in votings:
        print_voting_details(voting)
    
    # 3. Yeni oylama oluştur (sadece yoksa)
    if len(votings) == 0:
        print("3️⃣ Yeni oylama oluşturuluyor...")
        new_voting = create_voting(admin_token)
        if new_voting:
            votings = get_votings(admin_token)
            print(f"✅ Toplam {len(votings)} oylama var\n")
    
    # 4. Sakin girişi ve oy kullanma
    if len(votings) > 0:
        print("4️⃣ Sakin girişi yapılıyor...")
        sakin_token = login(USERS["sakin"]["email"], USERS["sakin"]["password"])
        if sakin_token:
            print("✅ Sakin girişi başarılı\n")
            
            # Sakin için oylamaları getir
            print("5️⃣ Sakin için oylamalar getiriliyor...")
            sakin_votings = get_votings(sakin_token)
            print(f"✅ Sakin {len(sakin_votings)} oylama görebiliyor\n")
            
            # İlk oylamaya oy kullan
            if len(sakin_votings) > 0:
                first_voting = sakin_votings[0]
                print(f"6️⃣ '{first_voting.get('title')}' oylamasına oy kullanılıyor...")
                
                if not first_voting.get('hasVoted') and first_voting.get('status') == 'active':
                    if 'options' in first_voting and len(first_voting['options']) > 0:
                        first_option = first_voting['options'][0]
                        cast_vote(sakin_token, first_voting['id'], first_option['id'])
                        
                        # Güncel durumu kontrol et
                        print("\n7️⃣ Güncel oylama durumu kontrol ediliyor...")
                        updated_votings = get_votings(admin_token)
                        if len(updated_votings) > 0:
                            print_voting_details(updated_votings[0])
                else:
                    if first_voting.get('hasVoted'):
                        print("ℹ️  Sakin zaten oy kullanmış")
                    elif first_voting.get('status') != 'active':
                        print(f"ℹ️  Oylama durumu: {first_voting.get('status')} (aktif değil)")
    
    # 8. Güvenlik girişi (oy kullanamaz)
    print("\n8️⃣ Güvenlik girişi yapılıyor...")
    security_token = login(USERS["security"]["email"], USERS["security"]["password"])
    if security_token:
        print("✅ Güvenlik girişi başarılı")
        security_votings = get_votings(security_token)
        print(f"✅ Güvenlik {len(security_votings)} oylama görebiliyor")
        print("ℹ️  Güvenlik personeli sadece sonuçları görebilir, oy kullanamaz\n")
    
    print("\n" + "="*60)
    print("✅ TEST TAMAMLANDI")
    print("="*60)
    
    print("\n📱 MOBİL UYGULAMA TEST NOKTALARI:")
    print("1. ✅ 'Devam Ediyor' ve 'Tamamlandı' etiketleri doğru görünüyor mu?")
    print("2. ✅ Tamamlanmış oylamalara tıklayınca sadece sonuçlar görünüyor mu?")
    print("3. ✅ Tamamlanmış oylamalarda 'Oy Ver' butonu gizli mi?")
    print("4. ✅ Tamamlanmış oylamalarda 'Oylama sonuçları' mesajı görünüyor mu?")
    print("5. ✅ Aktif oylamalarda oy kullanma işlevi çalışıyor mu?")
    print("6. ✅ Kiracılar oy kullanamıyor mu?")

if __name__ == "__main__":
    main()
