# Standart Test Kullanıcıları

## Durum: ✅ OLUŞTURULDU

Tüm standart test kullanıcıları başarıyla oluşturuldu ve test edildi.

## Kullanıcı Listesi

### 1. Admin
- **Email:** admin@site.com
- **Şifre:** admin123
- **Rol:** ADMIN
- **Site:** Yeşil Vadi Sitesi (ID: 1)
- **Durum:** ✅ Aktif

### 2. Sakin
- **Email:** sakin@site.com
- **Şifre:** sakin123
- **Rol:** RESIDENT
- **Site:** Yeşil Vadi Sitesi (ID: 1)
- **Durum:** ✅ Aktif

### 3. Güvenlik
- **Email:** guvenlik@site.com
- **Şifre:** guvenlik123
- **Rol:** SECURITY
- **Site:** Yeşil Vadi Sitesi (ID: 1)
- **Durum:** ✅ Aktif

### 4. Temizlik
- **Email:** temizlik@site.com
- **Şifre:** temizlik123
- **Rol:** CLEANING
- **Site:** Yeşil Vadi Sitesi (ID: 1)
- **Durum:** ✅ Aktif

### 5. Super Admin
- **Email:** superadmin@site.com
- **Şifre:** superadmin123
- **Rol:** SUPER_ADMIN
- **Site:** Yok (Tüm sitelere erişim)
- **Durum:** ✅ Aktif

## Test Sonuçları

Tüm kullanıcılar başarıyla test edildi:
```
✓ admin@site.com - Login successful
✓ sakin@site.com - Login successful
✓ guvenlik@site.com - Login successful
✓ temizlik@site.com - Login successful
✓ superadmin@site.com - Login successful
```

## Kullanım

Bu kullanıcılar mobil uygulamada ve web arayüzünde giriş yapmak için kullanılabilir.

### Mobil Uygulama
1. Uygulamayı aç
2. Email ve şifre ile giriş yap
3. Rolüne göre ilgili ekranlar açılacak

### Web Arayüzü
1. http://localhost:3000 adresine git
2. Email ve şifre ile giriş yap

## Yeniden Oluşturma

Kullanıcıları yeniden oluşturmak veya güncellemek için:
```bash
python BACKEND_NEW/create_standard_test_users.py
```

## Test Etme

Tüm kullanıcıların giriş yapabildiğini test etmek için:
```bash
python BACKEND_NEW/test_all_logins.py
```

## Notlar

- Tüm kullanıcılar (super admin hariç) Yeşil Vadi Sitesi'ne (ID: 1) bağlı
- Super admin tüm sitelere erişebilir
- Şifreler bcrypt ile hashlenmiş
- Tüm kullanıcılar aktif durumda ve email/telefon doğrulaması yapılmış
