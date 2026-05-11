# Mesajlaşma Daireler Sorunu Düzeltildi

## Sorun
Mesajlaşma kısmında daireler boş görünüyordu. Normalde orada oturanlar (ev sahibi, kiracı vb.) görünmesi gerekiyordu.

## Kök Neden
`MessageService.getSiteMemberIds()` metodunda yanlış SQL sorgusu vardı:

```java
String query = "SELECT user_id FROM user_site_memberships " +
              "WHERE site_id = :siteId AND role_type = 'sakin' " +  // ❌ Yanlış kolon adı
              "AND is_deleted = FALSE AND status = 'aktif'";
```

**Sorunlar:**
1. `role_type` kolonu veritabanında yok, `role` kolonu var
2. `role` değeri `ROLE_RESIDENT` formatında, `sakin` değil
3. Bu yüzden sorgu hiçbir kullanıcı döndürmüyordu
4. Site üyesi bulunamadığı için tüm daireler "Boş Daire" olarak gösteriliyordu

## Uygulanan Çözüm

### 1. SQL Sorgusu Düzeltildi
**Dosya:** `BACKEND_NEW/site/src/main/java/com/sitedefteri/service/MessageService.java`

`role_type` filtresi kaldırıldı, sadece site_id, is_deleted ve status kontrolü yapılıyor:

```java
String query = "SELECT user_id FROM user_site_memberships " +
              "WHERE site_id = :siteId " +
              "AND is_deleted = FALSE AND status = 'aktif'";
```

Bu değişiklik ile:
- Tüm site üyeleri (admin, sakin, güvenlik vb.) getiriliyor
- `getApartmentsForMessaging` metodu doğru kullanıcıları bulabiliyor
- Dairelerde owner ve resident bilgileri görüntüleniyor

### 2. Backend Yeniden Derlendi ve Başlatıldı
```bash
./BACKEND_YENIDEN_BASLAT.ps1
```

## Test Sonuçları

### API Testi
✅ `/api/sites/1/messages/apartments` endpoint'i test edildi

**Sonuçlar:**
- Toplam daire: 102
- Dolu daire: 101
- Boş daire: 1

### Örnek Daire Bilgileri

**A Blok 20:**
- Resident: A Blok 20 Kiracı (Kiracı) • Ayşe Özdemir (Malik)
- Owner ID: a20e4148-a428-46d7-a8df-a6eea615d677
- Owner Name: Ayşe Özdemir
- Tenant Name: A Blok 20 Kiracı
- Is Site Member: True

**A Blok 13:**
- Resident: Ali Doğan (Kiracı) • Ali Doğan (Malik)
- Owner ID: 5960a37a-1385-4478-86df-3b6d9bf683f6
- Owner Name: Ali Doğan
- Is Site Member: True

**A Blok 27:**
- Resident: A Blok 27 Kiracı (Kiracı) • Deniz Öztürk (Malik)
- Owner ID: 104d0dbc-82c6-4251-9406-2004bcb68b31
- Owner Name: Deniz Öztürk
- Tenant Name: A Blok 27 Kiracı
- Is Site Member: True

## Görüntüleme Formatı

Daireler şu formatta görüntüleniyor:
- **Sadece Malik:** "Ahmet Yılmaz (Malik)"
- **Sadece Kiracı:** "Mehmet Demir (Kiracı)"
- **Hem Malik Hem Kiracı:** "Mehmet Demir (Kiracı) • Ahmet Yılmaz (Malik)"
- **Boş Daire:** "Boş Daire"

## Etkilenen Özellikler

✅ Mesajlaşma sayfasında daire listesi
✅ Daire seçimi dropdown'ı
✅ Daire sakinleri görüntüleme
✅ Mesaj gönderme (daire bazlı)

## Test Dosyaları
- `BACKEND_NEW/test_messaging_apartments_api.py` - API testi
- `BACKEND_NEW/check_apartment_residents_messaging.py` - Veritabanı kontrolü

## Tarih
8 Mayıs 2026
