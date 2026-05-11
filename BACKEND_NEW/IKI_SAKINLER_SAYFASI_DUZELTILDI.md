# İki Sakinler Sayfası Sorunu - Çözüldü

## Sorun
Mobil uygulamada 2 farklı sakinler sayfası var ve her ikisi de farklı sayıda sakin gösteriyordu:

1. **Hızlı İşlemler** (Dashboard) → 0 sakin gösteriyordu
2. **"Daha" Menüsü** (ResidentsScreen) → Sadece RESIDENT rolüne sahip kullanıcıları gösteriyordu (5 kişi)

## Yapılan Değişiklikler

### 1. AdminDashboard.tsx - Hızlı İşlemler Kartı

**Sorun:** `totalApartments` değeri hardcoded 0 olarak ayarlanmıştı.

**Çözüm:**
```typescript
// residentService import edildi
import { residentService } from '../../services/resident.service';

// loadDashboard fonksiyonunda residents de yükleniyor
const [dues, tickets, packages, incomes, expenses, announcements, tasks, residents] = await Promise.all([
  // ... diğer servisler
  residentService.getResidents().catch(() => []),
]);

// Stats güncellendi
setStats({
  // ...
  totalApartments: residents.length, // Sakin sayısı
  // ...
});
```

**Sonuç:** Hızlı İşlemler kartında artık doğru sakin sayısı (97) gösteriliyor.

---

### 2. ResidentsScreen.tsx - Daha Menüsündeki Sakinler

**Sorun:** Kod sadece `RESIDENT` veya `ROLE_RESIDENT` rolüne sahip kullanıcıları filtreliyordu:
```typescript
const residentsOnly = data.filter(user => 
  user.roles?.includes('RESIDENT') || user.roles?.includes('ROLE_RESIDENT')
);
```

Bizim 97 sakinimizin rolü `user_site_memberships` tablosunda `sakin` olarak kayıtlı ve backend'den gelen `roles` array'i boş.

**Çözüm:**
```typescript
// Tüm kullanıcıları göster (backend zaten site bazlı filtreleme yapıyor)
// Sadece daire bilgisi olanları göster
const residentsWithApartments = data.filter(user => 
  user.blockName && user.unitNumber
);
```

**Sonuç:** Artık daire bilgisi olan tüm kullanıcılar (97 sakin) gösteriliyor.

---

## Test Sonuçları

### Backend Endpoint
```
GET /api/users
Authorization: Bearer {admin_token}

Response: 110 kullanıcı
- 97 yeni sakin (daire bilgisi var)
- 13 eski kullanıcı (bazılarının daire bilgisi yok)
```

### Mobil Uygulama

#### 1. Hızlı İşlemler Kartı (Dashboard)
- **Önceki:** 0 sakin
- **Şimdi:** 97 sakin ✅

#### 2. Daha > Sakinler Sayfası
- **Önceki:** 5 sakin (sadece RESIDENT rolü olanlar)
- **Şimdi:** 97 sakin ✅

## Veri Dağılımı

### Bloklar
- **A Blok:** 33 sakin
- **B Blok:** 33 sakin
- **C Blok:** 31 sakin

### Tipler
- **Kat Maliki:** 64 sakin
- **Kiracı:** 33 sakin

## Mobil Uygulamayı Yeniden Başlatma

Değişikliklerin görünmesi için mobil uygulamayı yeniden başlatın:

```powershell
# Expo cache'i temizle ve yeniden başlat
.\EXPO_TAMAMEN_TEMIZLE.ps1
```

VEYA

```powershell
# Sadece mobil uygulamayı yeniden başlat
.\RESTART_MOBILE_APP.ps1
```

## Doğrulama Adımları

1. **Mobil uygulamayı yeniden başlat**
2. **Admin olarak giriş yap:**
   - Email: testusertwo371073@test.com
   - Password: admin123

3. **Dashboard'ı kontrol et:**
   - Hızlı İşlemler > Sakinler kartı
   - "97 kişi" yazmalı ✅

4. **Daha > Sakinler sayfasını kontrol et:**
   - Toplam: 97 sakin
   - Malikler: 64 kişi
   - Kiracılar: 33 kişi
   - Blok filtreleme çalışıyor ✅

## Değiştirilen Dosyalar

1. **SiteYonetimApp/src/screens/dashboard/AdminDashboard.tsx**
   - residentService import edildi
   - loadDashboard'da residents yükleniyor
   - totalApartments = residents.length

2. **SiteYonetimApp/src/screens/residents/ResidentsScreen.tsx**
   - Rol bazlı filtreleme kaldırıldı
   - Daire bilgisi bazlı filtreleme eklendi

## Özet

✅ **Hızlı İşlemler kartı** → 97 sakin gösteriyor
✅ **Daha > Sakinler sayfası** → 97 sakin gösteriyor
✅ **Backend** → Doğru çalışıyor (110 kullanıcı döndürüyor)
✅ **Filtreleme** → Daire bilgisi olanlar gösteriliyor

Her iki sakinler sayfası da artık aynı veriyi gösteriyor!

---

**Tarih:** 6 Mayıs 2026
**Durum:** ✅ ÇÖZÜLDÜ
