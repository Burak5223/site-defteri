# Güvenlik ve Temizlik Dashboard Düzeltildi

## Problem
Güvenlik ve temizlik personeli dashboard'larında görev sayıları 0 olarak görünüyordu, ancak backend API doğru verileri döndürüyordu.

## Kök Neden
Mobile app'teki Security ve Cleaning dashboard'ları, backend'in hazır dashboard API'sini kullanmıyordu. Bunun yerine:
1. Task API'sinden tüm görevleri çekiyordu
2. Client-side'da `createdAt` tarihine göre filtreleme yapıyordu
3. Bu yüzden yanlış sayılar hesaplanıyordu

Backend'de `DashboardService.getResidentDashboard()` metodu zaten doğru şekilde:
- Kullanıcıya atanan görevleri sayıyor
- `assignedTo` field'ına göre filtreliyor
- Toplam, tamamlanan ve bekleyen görev sayılarını döndürüyor

## Çözüm

### 1. Backend API Doğrulaması
Backend API'si doğru çalışıyor:
```
Security (security@site.com):
  - Total Tasks: 5
  - Completed Tasks: 1
  - Pending Tasks: 4

Cleaning (cleaning@site.com):
  - Total Tasks: 7
  - Completed Tasks: 2
  - Pending Tasks: 5
```

### 2. Mobile App Değişiklikleri

#### SecurityDashboard.tsx
- `dashboardService.getResidentDashboard()` import edildi
- Stats state değiştirildi: `todayTasks/weekTasks` → `totalTasks/completedTasks/pendingTasks`
- `loadDashboard()` metodu güncellendi: Backend API'den görev sayılarını alıyor
- UI kartları güncellendi: Doğru stat field'larını gösteriyor

#### CleaningDashboard.tsx
- Aynı değişiklikler uygulandı
- Backend API'den görev sayılarını alıyor
- UI kartları güncellendi

#### dashboard.service.ts
- `ResidentDashboardStats` interface'ine task field'ları eklendi:
  - `totalTasks?: number`
  - `completedTasks?: number`
  - `pendingTasks?: number`

## Test Sonuçları

### Backend API Test
```bash
python BACKEND_NEW/test_security_cleaning_dashboards.py
```

✅ Security dashboard: 5 total, 1 completed, 4 pending
✅ Cleaning dashboard: 7 total, 2 completed, 5 pending

### Mobile App Test
Expo'yu yeniden başlatın:
```powershell
.\EXPO_CACHE_TEMIZLE_BASLAT.ps1
```

Sonra test edin:
1. `security@site.com` / `security123` ile giriş yapın
2. Dashboard'da görev sayılarını kontrol edin: 5 toplam, 1 tamamlanan, 4 bekleyen
3. `cleaning@site.com` / `cleaning123` ile giriş yapın
4. Dashboard'da görev sayılarını kontrol edin: 7 toplam, 2 tamamlanan, 5 bekleyen

## Değiştirilen Dosyalar
1. `SiteYonetimApp/src/screens/dashboard/SecurityDashboard.tsx`
2. `SiteYonetimApp/src/screens/dashboard/CleaningDashboard.tsx`
3. `SiteYonetimApp/src/services/dashboard.service.ts`

## Notlar
- Backend API zaten doğru çalışıyordu
- Sorun sadece mobile app'in API'yi kullanmamasıydı
- Artık tüm dashboard'lar backend'den gelen gerçek verileri kullanıyor
- Cache temizleme gerekebilir
