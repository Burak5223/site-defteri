# AKILLI SİTE YÖNETİM SİSTEMİ - SUNUM İÇERİĞİ

## SLAYT 1: KAPAK SAYFASI
**Başlık:** Akıllı Site Yönetim Sistemi
**Alt Başlık:** Entegre Web, Mobil ve Süper Admin Platformu
**Öğrenci Adı:** [Adınız]
**Danışman:** [Danışman Adı]
**Tarih:** Mayıs 2026
**Logo/Görsel:** Site yönetimi ikonu

---

## SLAYT 2: İÇİNDEKİLER
1. Proje Tanımı ve Amacı
2. Problem Tanımı
3. Çözüm Yaklaşımı
4. Sistem Mimarisi
5. Temel Özellikler
6. Kullanılan Teknolojiler
7. Kullanıcı Rolleri ve Yetkiler
8. Öne Çıkan Modüller
9. Güvenlik ve Performans
10. Demo ve Ekran Görüntüleri
11. Sonuç ve Gelecek Planları

---

## SLAYT 3: PROJE TANIMI
**Başlık:** Proje Nedir?

**İçerik:**
- **Akıllı Site Yönetim Sistemi**, apartman ve sitelerin tüm operasyonel süreçlerini dijitalleştiren kapsamlı bir platformdur
- **3 Ana Platform:**
  - 📱 Mobil Uygulama (React Native)
  - 💻 Web Yönetim Paneli (Next.js)
  - 👑 Süper Admin Paneli
- **Çoklu Site Yönetimi:** Tek platformdan birden fazla site yönetimi
- **Rol Bazlı Erişim:** Admin, Sakin, Güvenlik, Temizlik, Süper Admin

---

## SLAYT 4: PROJE AMACI
**Başlık:** Neden Bu Proje?

**Problemler:**
- ❌ Kağıt bazlı yönetim süreçleri
- ❌ İletişim kopuklukları
- ❌ Aidat takip zorlukları
- ❌ Paket ve ziyaretçi yönetimi karmaşıklığı
- ❌ Finansal raporlama eksikliği
- ❌ Güvenlik ve temizlik personeli koordinasyon sorunları

**Çözümler:**
- ✅ Tamamen dijital süreç yönetimi
- ✅ Anlık bildirimler ve mesajlaşma
- ✅ Otomatik aidat hesaplama ve takip
- ✅ QR kod ile paket teslim sistemi
- ✅ Detaylı finansal raporlama
- ✅ Görev yönetimi ve takip sistemi

---

## SLAYT 5: SİSTEM MİMARİSİ
**Başlık:** Teknik Mimari

```
┌─────────────────────────────────────────────┐
│           KULLANICI KATMANI                 │
├─────────────┬─────────────┬─────────────────┤
│  Mobil App  │  Web Panel  │  Super Admin    │
│ React Native│   Next.js   │    Next.js      │
└─────────────┴─────────────┴─────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│         API KATMANI (REST API)              │
│         Spring Boot + Java                  │
│         JWT Authentication                  │
└─────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│         VERİTABANI KATMANI                  │
│         MySQL Database                      │
│         40+ Tablo                           │
└─────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│         ENTEGRASYON SERVİSLERİ              │
│  Firebase (Push) │ Gemini AI │ Telegram     │
└─────────────────────────────────────────────┘
```

---

## SLAYT 6: KULLANILAN TEKNOLOJİLER
**Başlık:** Teknoloji Yığını

**Backend:**
- ☕ Java 17 + Spring Boot 3.x
- 🔐 Spring Security + JWT
- 🗄️ MySQL 8.0
- 📧 Firebase Cloud Messaging
- 🤖 Google Gemini AI Vision

**Frontend (Web):**
- ⚛️ Next.js 14 (React)
- 🎨 Tailwind CSS + Shadcn UI
- 📊 Recharts (Grafikler)
- 🔄 React Query

**Mobile:**
- 📱 React Native + Expo
- 🧭 React Navigation
- 🎯 TypeScript
- 🔔 Push Notifications

**DevOps:**
- 🐳 Docker
- 🚀 CI/CD Pipeline
- ☁️ Cloud Deployment Ready

---

## SLAYT 7: KULLANICI ROLLERİ VE YETKİLER
**Başlık:** Rol Bazlı Erişim Kontrolü

**1. Süper Admin** 👑
- Tüm siteleri yönetme
- Site ekleme/düzenleme/silme
- Toplu duyuru gönderme
- Sistem geneli raporlar
- Performans analizi

**2. Site Yöneticisi (Admin)** 👨‍💼
- Sakinleri yönetme
- Aidat atama ve takip
- Duyuru yayınlama
- Finansal raporlar
- Personel yönetimi

**3. Sakin (Resident)** 🏠
- Aidat görüntüleme ve ödeme
- Arıza/talep oluşturma
- Paket takibi
- Ziyaretçi kaydı
- Oylama katılımı

**4. Güvenlik Personeli** 🛡️
- Ziyaretçi onaylama
- Paket teslim alma
- Görev takibi
- Olay raporlama

**5. Temizlik Personeli** 🧹
- Görev listesi
- Tamamlanan işler
- Malzeme talepleri

---

## SLAYT 8: TEMEL ÖZELLIKLER (1/2)
**Başlık:** Ana Modüller

**1. Sakin Yönetimi** 👥
- Malik/Kiracı ayrımı
- Çoklu daire sahipliği
- Detaylı profil yönetimi
- Daire geçiş sistemi

**2. Aidat Yönetimi** 💰
- Otomatik aidat oluşturma
- Toplu aidat atama
- Online ödeme entegrasyonu
- Ödeme geçmişi
- Gecikme takibi

**3. Duyuru Sistemi** 📢
- Öncelik bazlı duyurular
- Site/Blok bazlı filtreleme
- Push notification
- Okunma takibi

**4. Mesajlaşma** 💬
- Sakin-Sakin mesajlaşma
- Sakin-Yönetim iletişimi
- Blok bazlı mesajlar
- Daire seçerek mesaj gönderme

---

## SLAYT 9: TEMEL ÖZELLIKLER (2/2)
**Başlık:** Gelişmiş Modüller

**5. Paket Yönetimi** 📦
- QR kod ile paket kaydı
- AI destekli kargo tanıma (Gemini Vision)
- Otomatik bildirim
- Teslim takibi
- KVKK uyumlu gizlilik

**6. Arıza/Talep Sistemi** 🔧
- Kategori bazlı talep
- Öncelik belirleme
- Durum takibi
- Fotoğraf ekleme
- Yorum sistemi

**7. Ziyaretçi Yönetimi** 🚪
- QR kod ile giriş
- Zaman sınırlı erişim
- Otomatik süre dolumu
- Güvenlik onayı

**8. E-Oylama** 🗳️
- Dijital oylama sistemi
- Anonim/Açık oylama
- Sonuç grafikleri
- Katılım takibi

---

## SLAYT 10: ÖZEL ÖZELLİKLER
**Başlık:** Öne Çıkan Yenilikler

**1. AI Destekli Kargo Tanıma** 🤖
- Google Gemini Vision API entegrasyonu
- Kargo fotoğrafından otomatik bilgi çıkarma
- Alıcı adı, kargo şirketi, takip no tanıma
- %80+ doğruluk oranı

**2. Çoklu Site Yönetimi** 🏢
- Tek platformdan birden fazla site
- Site bazlı izolasyon
- Merkezi raporlama
- Site arası veri güvenliği

**3. Finansal Analitik** 📊
- Gelir/Gider takibi
- Dönemsel raporlar
- Grafik ve tablolar
- Excel export
- Bütçe planlama

**4. Görev Yönetimi** ✅
- Personel görev atama
- Durum takibi
- Tarih bazlı planlama
- Performans raporları

---

## SLAYT 11: GÜVENLİK VE PERFORMANS
**Başlık:** Güvenlik Önlemleri

**Güvenlik:**
- 🔐 JWT Token Authentication
- 🛡️ Role-Based Access Control (RBAC)
- 🔒 Site bazlı veri izolasyonu
- 🚫 SQL Injection koruması
- ✅ Input validation
- 🔑 Şifreli veri saklama
- 📱 OTP doğrulama (Telegram)

**Performans:**
- ⚡ Optimize edilmiş sorgular
- 💾 Database indexing
- 🚀 Lazy loading
- 📦 Code splitting
- 🔄 Caching stratejileri
- 📊 Real-time dashboard

---

## SLAYT 12: VERİTABANI YAPISI
**Başlık:** Veritabanı Şeması

**Ana Tablolar (40+ tablo):**
- 👥 users, roles, user_roles
- 🏢 sites, blocks, apartments
- 💰 dues, payments, financial_periods
- 📢 announcements, messages
- 📦 packages, package_logs
- 🔧 tickets, ticket_comments
- 🚪 visitor_requests
- ✅ tasks
- 🗳️ voting, voting_options, votes
- 📊 expenses, incomes
- 🔔 notifications, user_fcm_tokens

**İlişkiler:**
- One-to-Many: Site → Blocks → Apartments
- Many-to-Many: Users ↔ Roles
- Soft Delete: is_deleted flag
- Audit: created_at, updated_at

---

## SLAYT 13: MOBİL UYGULAMA ÖZELLİKLERİ
**Başlık:** React Native Mobil App

**Özellikler:**
- 📱 iOS ve Android desteği
- 🎨 Modern ve kullanıcı dostu arayüz
- 🔔 Push notification
- 📸 Kamera entegrasyonu
- 📊 Interaktif grafikler
- 🌐 Offline mode desteği
- 🔄 Real-time senkronizasyon
- 🌍 Çoklu dil desteği (TR/EN)

**Ekranlar:**
- Dashboard (Rol bazlı)
- Aidat ve Ödemeler
- Duyurular
- Mesajlaşma
- Paket Takibi
- Arıza/Talep
- Ziyaretçi Yönetimi
- Profil ve Ayarlar

---

## SLAYT 14: WEB PANELİ ÖZELLİKLERİ
**Başlık:** Next.js Web Yönetim Paneli

**Admin Paneli:**
- 📊 Detaylı Dashboard
- 👥 Sakin Yönetimi
- 💰 Finansal Yönetim
- 📢 Duyuru Yönetimi
- 📦 Paket Yönetimi
- 🔧 Arıza/Talep Yönetimi
- 📈 Raporlama ve Analitik
- ⚙️ Site Ayarları

**Süper Admin Paneli:**
- 🏢 Çoklu Site Yönetimi
- 👑 Site Ekleme/Düzenleme
- 📊 Sistem Geneli İstatistikler
- 💬 Toplu Mesajlaşma
- 📈 Performans Analizi
- 👥 Tüm Kullanıcılar

---

## SLAYT 15: DEMO EKRAN GÖRÜNTÜLERİ
**Başlık:** Uygulama Görselleri

[Bu slayta ekran görüntüleri eklenecek]

**Gösterilecek Ekranlar:**
1. Mobil Dashboard (Sakin)
2. Aidat Ödeme Ekranı
3. Paket Takip (QR Kod)
4. Admin Dashboard
5. Finansal Raporlar
6. Süper Admin Panel
7. Mesajlaşma Ekranı
8. AI Kargo Tanıma

---

## SLAYT 16: PROJE İSTATİSTİKLERİ
**Başlık:** Sayılarla Proje

**Kod İstatistikleri:**
- 📝 40+ Veritabanı Tablosu
- 🎯 50+ API Endpoint
- 📱 30+ Mobil Ekran
- 💻 25+ Web Sayfası
- 👥 5 Farklı Kullanıcı Rolü
- 🔧 15+ Ana Modül
- 🌍 2 Dil Desteği (TR/EN)

**Test Verileri:**
- 👥 400+ Test Kullanıcısı
- 🏢 5 Farklı Site
- 🏠 150+ Daire
- 📦 Test Paketleri
- 💰 Finansal Veriler
- ✅ Görev Atamaları

---

## SLAYT 17: KARŞILAŞILAN ZORLUKLAR VE ÇÖZÜMLER
**Başlık:** Geliştirme Süreci

**Zorluklar:**
1. **Çoklu Site İzolasyonu**
   - Çözüm: Site bazlı veri filtreleme ve JWT token'da site_id

2. **Rol Bazlı Yetkilendirme**
   - Çözüm: Spring Security + Custom Authorization

3. **Real-time Bildirimler**
   - Çözüm: Firebase Cloud Messaging entegrasyonu

4. **AI Entegrasyonu**
   - Çözüm: Google Gemini Vision API

5. **Performans Optimizasyonu**
   - Çözüm: Database indexing, query optimization, caching

---

## SLAYT 18: TEST VE DOĞRULAMA
**Başlık:** Kalite Güvence

**Test Süreçleri:**
- ✅ Unit Testing (Backend)
- ✅ Integration Testing
- ✅ API Testing (Postman)
- ✅ UI/UX Testing
- ✅ Security Testing
- ✅ Performance Testing
- ✅ User Acceptance Testing

**Test Sonuçları:**
- 🎯 %95+ API Success Rate
- ⚡ <500ms Ortalama Response Time
- 🔒 Güvenlik Açığı: 0
- 📱 Mobil Crash Rate: <1%
- ✅ Tüm Kritik Özellikler Çalışıyor

---

## SLAYT 19: GELECEK PLANLAR
**Başlık:** Geliştirme Yol Haritası

**Kısa Vadeli (3-6 ay):**
- 📱 iOS App Store yayını
- 🤖 Chatbot entegrasyonu
- 📊 Gelişmiş analitik
- 🔔 SMS bildirimleri
- 💳 Ek ödeme yöntemleri

**Orta Vadeli (6-12 ay):**
- 🏢 Kurumsal paket
- 🌐 Multi-language (5+ dil)
- 📱 Tablet optimizasyonu
- 🤝 3. parti entegrasyonlar
- 📈 Makine öğrenmesi tahminleri

**Uzun Vadeli (1-2 yıl):**
- 🌍 Uluslararası pazar
- 🏗️ IoT cihaz entegrasyonu
- 🤖 Tam otomasyon
- ☁️ Blockchain entegrasyonu

---

## SLAYT 20: SONUÇ
**Başlık:** Proje Çıktıları

**Başarılar:**
- ✅ Tam fonksiyonel 3 platform (Web, Mobil, Süper Admin)
- ✅ 15+ modül başarıyla tamamlandı
- ✅ Modern teknoloji yığını kullanıldı
- ✅ Güvenli ve ölçeklenebilir mimari
- ✅ Kullanıcı dostu arayüz
- ✅ AI entegrasyonu başarılı

**Öğrenilenler:**
- 📚 Full-stack development
- 🏗️ Microservices mimarisi
- 🔐 Güvenlik best practices
- 📱 Cross-platform development
- 🤖 AI/ML entegrasyonu
- 👥 Proje yönetimi

---

## SLAYT 21: TEŞEKKÜRLER
**Başlık:** Teşekkür

**İçerik:**
Dinlediğiniz için teşekkür ederim!

**İletişim:**
- 📧 Email: [email@example.com]
- 💼 LinkedIn: [linkedin.com/in/...]
- 🐙 GitHub: [github.com/...]

**Sorular?**
Sorularınızı yanıtlamaktan mutluluk duyarım.

---

## EK SLAYTLAR (İsteğe Bağlı)

### EK 1: API Dokümantasyonu
- REST API endpoints
- Request/Response örnekleri
- Authentication flow

### EK 2: Veritabanı Diyagramı
- ER Diagram
- Tablo ilişkileri
- Index stratejisi

### EK 3: Deployment Süreci
- Docker containerization
- CI/CD pipeline
- Cloud deployment

### EK 4: Kod Örnekleri
- Backend service örneği
- Frontend component örneği
- Mobile screen örneği
