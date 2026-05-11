import requests

# API endpoint
url = "http://localhost:8080/api/sites/1/messages/apartments"

try:
    response = requests.get(url)
    response.raise_for_status()
    
    apartments = response.json()
    
    print("=" * 80)
    print("MESAJLAŞMA SİSTEMİ DAİRE SAYISI")
    print("=" * 80)
    print(f"\nToplam daire sayısı: {len(apartments)}")
    
    # Blok bazında dağılım
    blocks = {}
    for apt in apartments:
        block = apt.get('block', 'Diğer')
        if block not in blocks:
            blocks[block] = []
        blocks[block].append(apt)
    
    print(f"\nBlok bazında dağılım:")
    for block_name, block_apts in sorted(blocks.items()):
        print(f"  {block_name}: {len(block_apts)} daire")
    
    # Boş daireler
    empty_apartments = [apt for apt in apartments if apt.get('residentName') == 'Boş Daire']
    print(f"\nBoş daire sayısı: {len(empty_apartments)}")
    
    # Site üyesi olan daireler
    member_apartments = [apt for apt in apartments if apt.get('isSiteMember', False)]
    print(f"Site üyesi olan daire sayısı: {len(member_apartments)}")
    
    print("=" * 80)
    print("✓ Tüm daireler başarıyla listelendi!")
    print("=" * 80)
    
except Exception as e:
    print(f"✗ Hata: {e}")
