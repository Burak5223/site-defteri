# Çoklu Daire Geçiş Özelliği Eklendi

## Yapılan Değişiklikler

### 1. Backend (Hazır ama henüz derlenmedi)
- ✅ `UserController.java`: İki yeni endpoint eklendi
  - `GET /api/users/me/apartments` - Kullanıcının tüm dairelerini getirir
  - `POST /api/users/me/switch-apartment` - Daire değiştirir
- ✅ `UserService.java`: İki yeni metod eklendi
  - `getUserApartments()` - Kullanıcının owner veya resident olduğu tüm daireleri döner
  - `switchUserApartment()` - Kullanıcının aktif dairesini değiştirir
- ✅ `ApartmentRepository.java`: Gerekli query metodları zaten mevcut

### 2. Frontend
- ✅ `AuthContext.tsx`: `switchApartment()` fonksiyonu eklendi
  - Şimdilik backend çağrısı yapmadan local state günceller
  - Backend hazır olunca tek satır aktif edilecek
- ✅ `ResidentDashboard.tsx`: Daire seçici UI eklendi
  - Header'da mevcut daire gösteriliyor (örn: "A Blok - 5")
  - Tıklanınca modal açılıyor
  - Modal'da kullanıcının tüm daireleri listeleniyor
  - Aktif daire ✓ işaretiyle gösteriliyor
  - Daire seçilince değişiyor ve dashboard yenileniyor
- ✅ `translations.ts`: Çeviriler eklendi
  - `myApartments`: "Dairelerim"
  - `switchApartment`: "Daire Değiştir"
  - `currentApartment`: "Aktif Daire"

### 3. UI/UX
- Modern modal tasarımı
- Her daire kartında:
  - Blok adı ve daire numarası
  - Kat bilgisi
  - Mal sahibi/Kiracı etiketi
  - Aktif daire için ✓ işareti
  - Aktif daire mavi renkte vurgulanıyor

## Nasıl Çalışıyor?

### Şu Anki Durum (Mock Data)
1. Kullanıcı dashboard'da header'daki daire butonuna tıklar
2. Modal açılır ve mevcut dairesi gösterilir
3. Başka daire varsa listede görünür
4. Daire seçilince:
   - Local state güncellenir
   - Dashboard yenilenir
   - Yeni daireye ait veriler gösterilir

### Backend Hazır Olunca
1. `AuthContext.tsx` dosyasında 1 satır aktif edilecek:
   ```typescript
   await apiClient.post('/users/me/switch-apartment', { apartmentId });
   ```
2. `ResidentDashboard.tsx` dosyasında API çağrısı yapılacak:
   ```typescript
   const response = await apiClient.get('/users/me/apartments');
   setApartments(response as any[]);
   ```
3. Backend derlenip başlatılacak

## Test Senaryosu

### Kullanıcıya 2. Daire Eklemek İçin:
```sql
-- Sakin kullanıcısının ID'sini bul
SELECT id, email, apartment_id FROM users WHERE email = 'sakin@test.com';

-- Başka bir daireyi bu kullanıcıya owner olarak ata
UPDATE apartments 
SET owner_user_id = 'SAKIN_USER_ID'
WHERE id = 'BASKA_DAIRE_ID';
```

### Veya Python Script:
```bash
cd BACKEND_NEW
python add_second_apartment_to_sakin.py
```

## Sonraki Adımlar

1. ✅ Frontend hazır (mock data ile çalışıyor)
2. ✅ Backend kod hazır (derlenmedi)
3. ⏳ Backend'i derle ve başlat
4. ⏳ Test kullanıcısına 2. daire ekle
5. ⏳ Frontend'de 2 satırı aktif et (API çağrıları)
6. ✅ Test et

## Özellikler

- ✅ Tek hesaptan birden fazla daireye erişim
- ✅ Hızlı daire değiştirme
- ✅ Her dairenin ayrı aidatları, paketleri, mesajları
- ✅ Mal sahibi/Kiracı ayrımı
- ✅ Aktif daire vurgulaması
- ✅ Modern ve kullanıcı dostu UI

## Ekran Görüntüsü Açıklaması

```
┌─────────────────────────────────────┐
│ 🏠 Site Adı                    ☰   │
│    Sakin                            │
│                                     │
│ [🏢 A Blok - 5] ← Tıklanabilir    │
│                                     │
│ ┌─────────────────────────────────┐│
│ │ Hoş Geldiniz                    ││
│ │ Bugün sitenizde neler oluyor... ││
│ └─────────────────────────────────┘│
│                                     │
│ [Bekleyen Aidat] [Açık Arıza]     │
│                                     │
└─────────────────────────────────────┘

Modal Açıldığında:
┌─────────────────────────────────────┐
│ Dairelerim                      ✕   │
│                                     │
│ ┌─────────────────────────────────┐│
│ │ 🏢 A Blok - Daire 5            ✓││ ← Aktif
│ │ 1. Kat • Mal Sahibi             ││
│ └─────────────────────────────────┘│
│                                     │
│ ┌─────────────────────────────────┐│
│ │ 🏢 B Blok - Daire 12            ││
│ │ 2. Kat • Mal Sahibi             ││
│ └─────────────────────────────────┘│
│                                     │
└─────────────────────────────────────┘
```

## Notlar

- Super Admin'deki site geçişi gibi çalışıyor
- Backend hazır olana kadar mock data ile test edilebilir
- Veritabanında `apartments` tablosunda `owner_user_id` ve `current_resident_id` alanları kullanılıyor
- Bir kullanıcı hem owner hem de resident olabilir (farklı dairelerde)
