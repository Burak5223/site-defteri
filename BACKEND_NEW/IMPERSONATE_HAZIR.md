# Super Admin Impersonate Özelliği Hazır

## Durum
✅ Tüm siteler için impersonate özelliği hazır

## Site Admin Kullanıcıları

Her sitenin tam olarak **1 admin** kullanıcısı var:

| Site | Email | Şifre | Durum |
|------|-------|-------|-------|
| Yeşil Vadi Sitesi | admin@site.com | admin123 | ✅ |
| Mavi Deniz Rezidans | admin@mavidenizrezidans.com | admin123 | ✅ |
| Deniz Manzarası Sitesi | admin@denizmanzarasısitesi.com | admin123 | ✅ |
| Şehir Merkezi Residence | admin@şehirmerkeziresidence.com | admin123 | ✅ |
| Gül Bahçesi Rezidansı | admin@gülbahçesirezidansı.com | admin123 | ✅ |
| Orman Evleri | admin@ormanevleri.com | admin123 | ✅ |

## Teknik Detaylar

### Database Yapısı
Her admin kullanıcısı için:
1. **users** tablosunda kayıt var
2. **user_roles** tablosunda ROLE_ADMIN rolü atanmış
3. **user_site_memberships** tablosunda `role_type='yonetici'` kaydı var
4. **site_memberships** tablosunda site üyeliği var

### Impersonate Nasıl Çalışır?

1. Super admin mobil uygulamada "Siteler" ekranına gider
2. Bir site seçer
3. "Yönetici Olarak Giriş Yap" butonuna basar
4. Backend `SuperAdminService.getAllManagers()` metodunu çağırır
5. Bu metod `user_site_memberships` tablosunda `role_type='yonetici'` olan kullanıcıları bulur
6. İlk bulunan admin için JWT token oluşturulur
7. Super admin o sitenin admini olarak giriş yapar

### API Endpoint
```
POST /api/super-admin/impersonate
Body: { "siteId": "1" }
```

## Test

Super admin kullanıcısı ile giriş yapın:
- Email: `superadmin@system.com`
- Şifre: `super123`

Siteler ekranından herhangi bir siteye "Yönetici Olarak Giriş Yap" yapabilirsiniz.

## Yapılan İşlemler

1. ✅ Her site için admin kullanıcısı oluşturuldu
2. ✅ ROLE_ADMIN rolleri atandı
3. ✅ user_site_memberships tablosuna `role_type='yonetici'` kayıtları eklendi
4. ✅ Yeşilvadi sitesi için sadece `admin@site.com` bırakıldı
5. ✅ Diğer sitelerden fazla admin kullanıcıları silindi
6. ✅ Her sitenin tam olarak 1 admin kullanıcısı var

## Scriptler

- `create_admins_for_all_sites.py` - Tüm siteler için admin oluşturur
- `add_admin_memberships.py` - Admin kullanıcılarına yonetici membership ekler
- `keep_one_admin_per_site.py` - Her sitede sadece 1 admin bırakır
- `check_all_yonetici_users.py` - Tüm yonetici kullanıcılarını listeler
- `verify_all_site_admins.py` - Site adminlerini doğrular
