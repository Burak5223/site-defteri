# Teslim Kodu Özelliği - Test Rehberi

## Otomatik Test

### 1. Backend Test
```powershell
.\TEST_DELIVERY_CODE.ps1
```

Bu script:
1. Database migration'ı uygular
2. Integration testleri çalıştırır
3. İki senaryo test eder:
   - Senaryo 1: Teslim kodu ile
   - Senaryo 2: Teslim kodu olmadan

## Manuel Test - Mobil Uygulama

### Senaryo 1: Teslim Kodu ile Kargo

#### Adım 1: Sakin Tarafı (Resident)
1. **Login**
   - Username: `sakinuser`
   - Password: `123456`

2. **Paketler Ekranına Git**
   - Ana menüden "Paketler" seçeneğine tıkla

3. **Kargom Var Bildirimi Oluştur**
   - Sağ üstteki 🔔 (Bildirim) butonuna tıkla
   - Form açılır

4. **Formu Doldur**
   - **Ad Soyad**: Otomatik dolu (değiştirme)
   - **Daire Numarası**: Otomatik dolu (değiştirme)
   - **Kargo Şirketi**: `Yurtiçi Kargo` (opsiyonel)
   - **Beklenen Tarih**: Bugünün tarihi (opsiyonel)
   - **Teslim Kodu**: `1234` ⭐ **ÖNEMLİ**

5. **Gönder**
   - "Gönder" butonuna tıkla
   - Başarılı mesajı bekle

6. **Doğrulama**
   - ✅ "Başarılı" alert'i göründü mü?
   - ✅ "Kargo bildirimi oluşturuldu" mesajı var mı?

#### Adım 2: Güvenlik Tarafı (Security)
1. **Logout ve Login**
   - Sakin hesabından çıkış yap
   - Güvenlik hesabıyla giriş yap
   - Username: `guvenlik`
   - Password: `123456`

2. **Paketler Ekranına Git**
   - Ana menüden "Paketler" seçeneğine tıkla

3. **AI ile Kargo Kaydet**
   - "AI Kargo Kayıt" butonuna tıkla
   - Kargo fişi fotoğrafı çek (veya test için manuel gir)
   - **Alıcı Adı**: Sakinin adı (örn: "Sakin User")
   - **Kargo Şirketi**: `Yurtiçi Kargo`
   - **Takip No**: `TR123456789`
   - Kaydet

4. **Sistem Eşleştirmesi**
   - Sistem otomatik olarak sakinin bildirimi ile eşleştirir
   - Paket listesinde görünür

5. **Paketi Teslim Et**
   - Paket kartında "Teslim Et" butonuna tıkla
   - ⭐ **BEKLENEN SONUÇ**: Alert açılır

6. **Alert Doğrulaması**
   ```
   🔐 Teslim Kodu
   
   Bu paketin teslim kodu:
   
   1234
   
   Lütfen bu kodu kuryeye söyleyin.
   
   [İptal] [Kodu Söyledim, Teslim Et]
   ```

7. **Teslim Tamamla**
   - "Kodu Söyledim, Teslim Et" butonuna tıkla
   - Başarılı mesajı bekle

8. **Doğrulama**
   - ✅ Alert göründü mü?
   - ✅ Kod doğru gösterildi mi? (1234)
   - ✅ Teslim başarılı oldu mu?

### Senaryo 2: Teslim Kodu Olmadan Kargo

#### Adım 1: Sakin Tarafı
1. **Login** (sakinuser)
2. **Kargom Var Bildirimi Oluştur**
3. **Formu Doldur**
   - Ad Soyad: Otomatik
   - Daire Numarası: Otomatik
   - Kargo Şirketi: `Aras Kargo`
   - **Teslim Kodu**: **BOŞ BIRAK** ⭐
4. **Gönder**

#### Adım 2: Güvenlik Tarafı
1. **Login** (guvenlik)
2. **AI ile Kargo Kaydet**
   - Alıcı: Sakinin adı
   - Kargo: `Aras Kargo`
   - Takip: `AR987654321`
3. **Paketi Teslim Et**
   - "Teslim Et" butonuna tıkla
   - ⭐ **BEKLENEN SONUÇ**: Alert AÇILMAZ
   - Direkt teslim edilir

4. **Doğrulama**
   - ✅ Alert açılmadı mı?
   - ✅ Teslim direkt tamamlandı mı?

## Test Kontrol Listesi

### Backend Test
- [ ] Migration başarılı
- [ ] Integration testleri geçti
- [ ] Senaryo 1 (kod ile) başarılı
- [ ] Senaryo 2 (kodsuz) başarılı

### Mobil Test - Sakin
- [ ] "Kargom Var" formu açılıyor
- [ ] "Teslim Kodu" alanı görünüyor
- [ ] Placeholder doğru: "Örn: 1234, ABC123"
- [ ] Hint metni doğru
- [ ] Kod girişi çalışıyor
- [ ] Form gönderimi başarılı
- [ ] Başarı mesajı gösteriliyor

### Mobil Test - Güvenlik
- [ ] Paket listesi yükleniyor
- [ ] "Teslim Et" butonu görünüyor
- [ ] Kod varsa alert açılıyor
- [ ] Alert'te kod doğru gösteriliyor
- [ ] "İptal" butonu çalışıyor
- [ ] "Kodu Söyledim, Teslim Et" butonu çalışıyor
- [ ] Teslim başarılı oluyor
- [ ] Kod yoksa alert açılmıyor

## Hata Durumları

### Hata 1: Alert Açılmıyor
**Sebep**: deliveryCode backend'den gelmiyor
**Çözüm**:
1. Backend log'larını kontrol et
2. Package entity'de deliveryCode var mı?
3. PackageResponse'da deliveryCode map ediliyor mu?

### Hata 2: Kod Yanlış Gösteriliyor
**Sebep**: Eşleştirme hatası
**Çözüm**:
1. Database'de delivery_code alanını kontrol et
2. Notification ile package eşleşmesi doğru mu?

### Hata 3: Form Gönderilmiyor
**Sebep**: Validation hatası
**Çözüm**:
1. Console log'larını kontrol et
2. API response'u kontrol et
3. deliveryCode max 50 karakter mi?

## Database Kontrol

### Notification'da Kod Kontrolü
```sql
SELECT id, full_name, delivery_code, status, created_at
FROM resident_cargo_notifications
WHERE delivery_code IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

### Package'da Kod Kontrolü
```sql
SELECT id, courier_name, delivery_code, status, recorded_at
FROM packages
WHERE delivery_code IS NOT NULL
ORDER BY recorded_at DESC
LIMIT 10;
```

### Eşleşme Kontrolü
```sql
SELECT 
    p.id as package_id,
    p.courier_name,
    p.delivery_code as package_code,
    p.status,
    n.id as notification_id,
    n.full_name,
    n.delivery_code as notification_code
FROM packages p
LEFT JOIN resident_cargo_notifications n ON p.matched_notification_id = n.id
WHERE p.delivery_code IS NOT NULL
ORDER BY p.recorded_at DESC
LIMIT 10;
```

## Performans Testi

### Test 1: Çok Sayıda Kod
1. 100 farklı teslim kodu ile notification oluştur
2. Hepsini eşleştir
3. Teslim et
4. Performans ölç

### Test 2: Aynı Kod
1. Aynı kodu kullanan 2 farklı notification oluştur
2. Sistem nasıl davranıyor?
3. Doğru eşleştirme yapılıyor mu?

## Güvenlik Testi

### Test 1: SQL Injection
- Teslim koduna `'; DROP TABLE packages; --` gir
- Sistem korunuyor mu?

### Test 2: XSS
- Teslim koduna `<script>alert('XSS')</script>` gir
- Escape ediliyor mu?

### Test 3: Uzun Kod
- 100 karakterlik kod gir
- Validation çalışıyor mu? (max 50)

## Sonuç

Tüm testler başarılı ise:
✅ Teslim kodu özelliği çalışıyor!
✅ Sakin kod girebiliyor
✅ Güvenlik kodu görebiliyor
✅ Alert doğru çalışıyor
✅ Kodsuz akış da çalışıyor

Herhangi bir test başarısız ise:
❌ Yukarıdaki hata durumlarını kontrol et
❌ Log'ları incele
❌ Database'i kontrol et
