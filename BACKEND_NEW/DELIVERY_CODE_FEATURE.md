# Teslim Kodu Özelliği (Delivery Code Feature)

## Genel Bakış

Sakinin kargo şirketinden aldığı teslim kodunu sisteme girmesini ve güvenliğin paketi teslim ederken bu kodu görmesini sağlayan özellik.

## Kullanım Senaryosu

1. **Sakin**: Kargom var bildirimi oluştururken kargo şirketinden aldığı kodu girer (opsiyonel)
2. **Güvenlik**: Kargo gelir, AI ile fotoğraf çekip kaydeder
3. **Sistem**: Eğer sakin kod girmişse ve güvenliğin kaydettiği kargo ile eşleşiyorsa
4. **Güvenlik**: Paketi teslim ederken alert/modal açılır ve sakinin kodu gösterilir
5. **Güvenlik**: Kodu kuryeye söyler, kurye doğru kodu söylerse teslim eder

## Veritabanı Değişiklikleri

### 1. packages tablosu
```sql
ALTER TABLE packages 
ADD COLUMN delivery_code VARCHAR(50) NULL 
COMMENT 'Kargo şirketinden gelen teslim kodu (opsiyonel)';

CREATE INDEX idx_packages_delivery_code ON packages(delivery_code);
```

### 2. resident_cargo_notifications tablosu
```sql
ALTER TABLE resident_cargo_notifications 
ADD COLUMN delivery_code VARCHAR(50) NULL 
COMMENT 'Teslim kodu (kargo şirketinden gelen kod)';

CREATE INDEX idx_resident_cargo_notifications_delivery_code 
ON resident_cargo_notifications(delivery_code);
```

## Backend Değişiklikleri

### 1. Package Entity
- `deliveryCode` alanı eklendi

### 2. PackageResponse DTO
- `deliveryCode` alanı eklendi

### 3. CreatePackageRequest DTO
- `deliveryCode` alanı eklendi (opsiyonel, max 50 karakter)

### 4. PackageService
- `toResponse()` metodunda deliveryCode mapping eklendi
- `createPackage()` metodunda deliveryCode set edildi

## Frontend (Mobil) Değişiklikleri

### 1. Package Interface (package.service.ts)
```typescript
export interface Package {
  // ... diğer alanlar
  deliveryCode?: string;  // Optional code from courier company
}
```

### 2. ResidentNotificationRequest Interface
```typescript
export interface ResidentNotificationRequest {
  // ... diğer alanlar
  deliveryCode?: string;  // Optional delivery code from courier company
}
```

### 3. ResidentNotificationModal Component
- Yeni alan eklendi: "Teslim Kodu (Opsiyonel)"
- Placeholder: "Örn: 1234, ABC123"
- Hint: "Kargo şirketinden aldığınız teslim kodunu girebilirsiniz"
- Auto-capitalize: characters (büyük harfle yazılır)

### 4. SecurityPackages Component
- `handleDeliver()` fonksiyonu güncellendi
- Eğer pakette `deliveryCode` varsa:
  - Alert gösterilir: "🔐 Teslim Kodu"
  - Kod büyük fontla gösterilir
  - İki seçenek: "İptal" veya "Kodu Söyledim, Teslim Et"
- Eğer kod yoksa normal teslim akışı devam eder

## Migration

### Otomatik Migration
```bash
cd BACKEND_NEW
python apply_delivery_code_migration.py
```

### Manuel Migration
```bash
mysql -u root -p smart_site_management < add_delivery_code_field.sql
mysql -u root -p smart_site_management < add_delivery_code_to_notifications.sql
```

## Test Senaryosu

### Senaryo 1: Kod ile Kargo
1. Sakin "Kargom Var" butonuna tıklar
2. Formu doldurur ve "Teslim Kodu" alanına "1234" yazar
3. Güvenlik kargo geldiğinde AI ile kaydeder
4. Sistem eşleşme yapar
5. Güvenlik "Teslim Et" butonuna tıkladığında alert açılır:
   ```
   🔐 Teslim Kodu
   
   Bu paketin teslim kodu:
   
   1234
   
   Lütfen bu kodu kuryeye söyleyin.
   
   [İptal] [Kodu Söyledim, Teslim Et]
   ```
6. Güvenlik kodu kuryeye söyler ve "Kodu Söyledim, Teslim Et" butonuna tıklar
7. Paket teslim edilir

### Senaryo 2: Kodsuz Kargo
1. Sakin "Kargom Var" butonuna tıklar
2. Formu doldurur ama "Teslim Kodu" alanını boş bırakır
3. Güvenlik kargo geldiğinde AI ile kaydeder
4. Sistem eşleşme yapar
5. Güvenlik "Teslim Et" butonuna tıkladığında direkt teslim edilir (alert yok)

## Güvenlik ve Gizlilik

- Teslim kodu **opsiyoneldir**
- Sadece **güvenlik** ve **admin** rolleri kodu görebilir
- Sakin kendi kodunu göremez (güvenlik için)
- Kod veritabanında **plain text** olarak saklanır (hassas veri değil)
- Maksimum 50 karakter

## Avantajlar

1. **Güvenlik**: Kuryenin doğru kişiye teslim ettiğinden emin olunur
2. **Esneklik**: Opsiyonel alan, zorunlu değil
3. **Kullanıcı Dostu**: Basit ve anlaşılır arayüz
4. **Hızlı**: Güvenlik kodu hemen görür, beklemez

## Gelecek Geliştirmeler

- [ ] SMS ile kod gönderimi
- [ ] QR kod ile kod paylaşımı
- [ ] Kod doğrulama (kurye kodu girer, sistem kontrol eder)
- [ ] Kod geçerlilik süresi
- [ ] Kod kullanım logları

## Dosyalar

### Backend
- `BACKEND_NEW/site/src/main/java/com/sitedefteri/entity/Package.java`
- `BACKEND_NEW/site/src/main/java/com/sitedefteri/dto/response/PackageResponse.java`
- `BACKEND_NEW/site/src/main/java/com/sitedefteri/dto/request/CreatePackageRequest.java`
- `BACKEND_NEW/site/src/main/java/com/sitedefteri/service/PackageService.java`

### Frontend (Mobil)
- `SiteYonetimApp/src/services/package.service.ts`
- `SiteYonetimApp/src/components/modals/ResidentNotificationModal.tsx`
- `SiteYonetimApp/src/screens/packages/SecurityPackages.tsx`

### Database
- `BACKEND_NEW/add_delivery_code_field.sql`
- `BACKEND_NEW/add_delivery_code_to_notifications.sql`
- `BACKEND_NEW/apply_delivery_code_migration.py`

## Sonuç

Teslim kodu özelliği başarıyla eklendi. Sakinler artık kargo şirketinden aldıkları kodları sisteme girebilir ve güvenlik bu kodları görerek daha güvenli teslim yapabilir.
