# Admin Users Created for All Sites

## Problem
Super admin's impersonate feature was failing with error: "Bu site için yönetici bulunamadı" (Admin not found for this site)

## Root Cause
The `getAllManagers()` method in `SuperAdminService` looks for users with `role_type='yonetici'` in the `user_site_memberships` table. Only Yeşilvadi sitesi had admin users with this membership.

## Solution
1. Created admin users for all 6 sites with ROLE_ADMIN role
2. Added `user_site_memberships` entries with `role_type='yonetici'` for all admin users

## Admin Users Created

| Site | Email | Password | User ID |
|------|-------|----------|---------|
| Yeşil Vadi Sitesi | admin@yeşilvadisitesi.com | admin123 | (auto-generated) |
| Mavi Deniz Rezidans | admin@mavidenizrezidans.com | admin123 | (auto-generated) |
| Deniz Manzarası Sitesi | admin@denizmanzarasısitesi.com | admin123 | (auto-generated) |
| Şehir Merkezi Residence | admin@şehirmerkeziresidence.com | admin123 | (auto-generated) |
| Gül Bahçesi Rezidansı | admin@gülbahçesirezidansı.com | admin123 | (auto-generated) |
| Orman Evleri | admin@ormanevleri.com | admin123 | (auto-generated) |

## Database Changes

### Tables Modified
1. **users** - Added 6 new admin users (one per site)
2. **user_roles** - Assigned ROLE_ADMIN to all new users
3. **site_memberships** - Created site membership records
4. **user_site_memberships** - Added memberships with `role_type='yonetici'`

### Scripts Used
- `create_admins_for_all_sites.py` - Created admin users with ROLE_ADMIN
- `add_admin_memberships.py` - Added user_site_memberships with role_type='yonetici'

## Verification

Total 'yonetici' memberships: 8
- 6 new admin users (one per site)
- 2 existing managers in Yeşil Vadi Sitesi

## Testing
The impersonate feature should now work for all sites. Super admin can:
1. Go to Sites screen
2. Click on any site
3. Click "Yönetici Olarak Giriş Yap" (Login as Admin)
4. System will find the admin user and generate a token for impersonation

## Notes
- All admin users have the same password: `admin123`
- Password hash used: `$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYKZblo6QLG`
- Admin users are properly linked to their respective sites
- Each admin has both ROLE_ADMIN in user_roles and role_type='yonetici' in user_site_memberships
