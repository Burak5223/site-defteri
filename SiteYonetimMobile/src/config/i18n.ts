export type Language = 'tr' | 'en' | 'ru' | 'ar';

export const translations = {
  tr: {
    // Common
    home: 'Ana Sayfa',
    profile_title: 'Profil',
    settings: 'Ayarlar',
    logout: 'Çıkış Yap',
    
    // Roles
    role_admin: 'Yönetici',
    role_resident: 'Sakin',
    role_cleaner: 'Temizlik Görevlisi',
    role_security: 'Güvenlik Görevlisi',
    
    // Navigation
    residents_title: 'Sakinler',
    sites_title: 'Siteler',
    finance_title: 'Finans',
    dues_title: 'Aidatlar',
    tickets_title: 'Destek Talepleri',
    maintenance_title: 'Bakım',
    tasks_title: 'Görevler',
    packages_title: 'Paketler',
    messages_title: 'Mesajlar',
    announcements_title: 'Duyurular',
    voting_title: 'Oylamalar',
    
    // Sites
    sites_switch: 'Site Değiştir',
    sites_add: 'Yeni Site Ekle',
    
    // Dashboard
    home_open_tickets: 'Açık Talepler',
    home_today_tasks: 'Bugünkü Görevler',
  },
  en: {
    // Common
    home: 'Home',
    profile_title: 'Profile',
    settings: 'Settings',
    logout: 'Logout',
    
    // Roles
    role_admin: 'Administrator',
    role_resident: 'Resident',
    role_cleaner: 'Cleaner',
    role_security: 'Security',
    
    // Navigation
    residents_title: 'Residents',
    sites_title: 'Sites',
    finance_title: 'Finance',
    dues_title: 'Dues',
    tickets_title: 'Support Tickets',
    maintenance_title: 'Maintenance',
    tasks_title: 'Tasks',
    packages_title: 'Packages',
    messages_title: 'Messages',
    announcements_title: 'Announcements',
    voting_title: 'Voting',
    
    // Sites
    sites_switch: 'Switch Site',
    sites_add: 'Add New Site',
    
    // Dashboard
    home_open_tickets: 'Open Tickets',
    home_today_tasks: 'Today Tasks',
  },
  ru: {
    // Common
    home: 'Главная',
    profile_title: 'Профиль',
    settings: 'Настройки',
    logout: 'Выход',
    
    // Roles
    role_admin: 'Администратор',
    role_resident: 'Житель',
    role_cleaner: 'Уборщик',
    role_security: 'Охранник',
    
    // Navigation
    residents_title: 'Жители',
    sites_title: 'Объекты',
    finance_title: 'Финансы',
    dues_title: 'Взносы',
    tickets_title: 'Заявки',
    maintenance_title: 'Обслуживание',
    tasks_title: 'Задачи',
    packages_title: 'Посылки',
    messages_title: 'Сообщения',
    announcements_title: 'Объявления',
    voting_title: 'Голосование',
    
    // Sites
    sites_switch: 'Сменить объект',
    sites_add: 'Добавить объект',
    
    // Dashboard
    home_open_tickets: 'Открытые заявки',
    home_today_tasks: 'Задачи на сегодня',
  },
  ar: {
    // Common
    home: 'الرئيسية',
    profile_title: 'الملف الشخصي',
    settings: 'الإعدادات',
    logout: 'تسجيل الخروج',
    
    // Roles
    role_admin: 'مدير',
    role_resident: 'مقيم',
    role_cleaner: 'عامل نظافة',
    role_security: 'أمن',
    
    // Navigation
    residents_title: 'المقيمون',
    sites_title: 'المواقع',
    finance_title: 'المالية',
    dues_title: 'المستحقات',
    tickets_title: 'طلبات الدعم',
    maintenance_title: 'الصيانة',
    tasks_title: 'المهام',
    packages_title: 'الطرود',
    messages_title: 'الرسائل',
    announcements_title: 'الإعلانات',
    voting_title: 'التصويت',
    
    // Sites
    sites_switch: 'تغيير الموقع',
    sites_add: 'إضافة موقع جديد',
    
    // Dashboard
    home_open_tickets: 'الطلبات المفتوحة',
    home_today_tasks: 'مهام اليوم',
  },
};

export type TranslationKey = keyof typeof translations.tr;

export function getTranslation(lang: Language, key: TranslationKey): string {
  return translations[lang][key] || translations.tr[key] || key;
}

export function isRTL(lang: Language): boolean {
  return lang === 'ar';
}
