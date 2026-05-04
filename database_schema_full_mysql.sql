-- ==========================================================
-- SMART SITE MANAGEMENT SYSTEM - COMPLETE DATABASE SCHEMA
-- Prtabase Schema v2.0 (Full Conversion from PostgreSQL)
-- 
-- NOT: Bu script mevcut verileri korur!
-- - DROP DATABASE komutu kaldırıldı
-- - Tüm CREATE TABLE komutları IF NOT EXISTS ile güncellendi
-- - INSERT komutları IGNORE ile güvenli hale getirildi
-- - Mevcut tablolar ve veriler korunur, sadece eksikler eklenir
-- ============================================

-- Disable foreign key checks for bulk creation
SET FOREIGN_KEY_CHECKS = 0;

-- Database Setup (Mevcut verileri korur)
CREATE DATABASE IF NOT EXISTS smart_site_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smart_site_management;

-- ============================================
-- 1. CORE TABLES: SITE HIERARCHY
-- ============================================

-- Currencies
CREATE TABLE IF NOT EXISTS currencies (
    code VARCHAR(3) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    symbol VARCHAR(5) NOT NULL,
    decimals INT NOT NULL DEFAULT 2,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Exchange Rates (TEK VE TUTARLI VERSİYON)
CREATE TABLE IF NOT EXISTS exchange_rates (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    currency_code VARCHAR(3) NOT NULL,
    rate DECIMAL(10, 6) NOT NULL,
    rate_date DATE NOT NULL,
    provider VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (currency_code) REFERENCES currencies(code),
    UNIQUE KEY unique_rate_per_day (currency_code, rate_date)
) ENGINE=InnoDB;

-- Sites
CREATE TABLE IF NOT EXISTS sites (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    subscription_status ENUM('aktif', 'askida', 'iptal', 'suresi_dolmus') NOT NULL DEFAULT 'aktif',
    subscription_expiry DATE,
    commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 2.00,
    owner_id CHAR(36),
    logo_url TEXT,
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    settings JSON,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    deleted_by CHAR(36)
) ENGINE=InnoDB;

-- Blocks
CREATE TABLE IF NOT EXISTS blocks (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    site_id CHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    total_floors INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    deleted_by CHAR(36),
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Apartments
CREATE TABLE IF NOT EXISTS apartments (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    block_id CHAR(36) NOT NULL,
    unit_number VARCHAR(20) NOT NULL,
    floor INT NOT NULL,
    unit_type ENUM('1+0', '1+1', '2+1', '3+1', '4+1', 'penthouse', 'dublex', 'villa', 'diger') NOT NULL,
    area DECIMAL(10, 2),
    bedrooms INT,
    bathrooms INT,
    current_resident_id CHAR(36),
    owner_user_id CHAR(36),
    status ENUM('dolu', 'bos', 'tadilatta') NOT NULL DEFAULT 'bos',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    deleted_by CHAR(36),
    FOREIGN KEY (block_id) REFERENCES blocks(id) ON DELETE CASCADE,
    UNIQUE KEY unique_unit_per_block (block_id, unit_number)
) ENGINE=InnoDB;

-- Common Areas
CREATE TABLE IF NOT EXISTS common_areas (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    site_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    capacity INT,
    requires_reservation BOOLEAN NOT NULL DEFAULT FALSE,
    hourly_rate DECIMAL(10, 2),
    currency_code VARCHAR(3),
    available_hours JSON,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    deleted_by CHAR(36),
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    FOREIGN KEY (currency_code) REFERENCES currencies(code)
) ENGINE=InnoDB;

-- ============================================
-- 2. AUTH & USER MANAGEMENT
-- ============================================

-- Users
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    status ENUM('dogrulama_bekliyor', 'aktif', 'askida', 'yasakli') NOT NULL DEFAULT 'dogrulama_bekliyor',
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    profile_photo_url TEXT,
    preferred_language VARCHAR(5) NOT NULL DEFAULT 'tr',
    last_login_at TIMESTAMP NULL,
    last_login_ip VARCHAR(45),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    deleted_by CHAR(36)
) ENGINE=InnoDB;

-- User Site Memberships
CREATE TABLE IF NOT EXISTS user_site_memberships (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    site_id CHAR(36) NOT NULL,
    role_type ENUM('yonetici', 'sakin', 'temizlik_personeli', 'guvenlik') NOT NULL,
    user_type ENUM('kat_maliki', 'kiraci', 'personel') NOT NULL,
    status ENUM('aktif', 'askida', 'ayrildi') NOT NULL DEFAULT 'aktif',
    joined_at DATE NOT NULL DEFAULT (CURRENT_DATE),
    left_at DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    deleted_by CHAR(36),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_site (user_id, site_id)
) ENGINE=InnoDB;

-- Residency History
CREATE TABLE IF NOT EXISTS residency_history (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    apartment_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    is_owner BOOLEAN NOT NULL,
    move_in_date DATE NOT NULL,
    move_out_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    approved_by CHAR(36),
    approved_at TIMESTAMP NULL,
    contract_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    deleted_by CHAR(36),
    FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Roles
CREATE TABLE IF NOT EXISTS roles (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    scope VARCHAR(20) NOT NULL DEFAULT 'site',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Permissions
CREATE TABLE IF NOT EXISTS permissions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    permission_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Role Permissions
CREATE TABLE IF NOT EXISTS role_permissions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    role_id CHAR(36) NOT NULL,
    permission_id CHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_role_permission (role_id, permission_id)
) ENGINE=InnoDB;

-- User Roles
CREATE TABLE IF NOT EXISTS user_roles (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    role_id CHAR(36) NOT NULL,
    site_id CHAR(36),
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_by CHAR(36),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    deleted_by CHAR(36),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Verification Codes
CREATE TABLE IF NOT EXISTS verification_codes (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    code VARCHAR(10) NOT NULL,
    type ENUM('email_dogrulama', 'giris_otp', 'odeme_otp', 'hassas_islem') NOT NULL,
    delivery_method VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    used_at TIMESTAMP NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Login Sessions
CREATE TABLE IF NOT EXISTS login_sessions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    token TEXT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    last_activity_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Devices
CREATE TABLE IF NOT EXISTS devices (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    device_token TEXT NOT NULL,
    platform VARCHAR(20) NOT NULL,
    device_name VARCHAR(255),
    registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Invitations
CREATE TABLE IF NOT EXISTS invitations (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    site_id CHAR(36) NOT NULL,
    apartment_id CHAR(36),
    email VARCHAR(255) NOT NULL,
    role ENUM('yonetici', 'sakin', 'temizlik_personeli', 'guvenlik') NOT NULL,
    user_type ENUM('kat_maliki', 'kiraci', 'personel'),
    token TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    expires_at TIMESTAMP NOT NULL,
    invited_by CHAR(36) NOT NULL,
    accepted_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    deleted_by CHAR(36),
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE SET NULL,
    FOREIGN KEY (invited_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- Resident Permissions (Owner/Tenant yetki kuralları)
CREATE TABLE IF NOT EXISTS resident_permissions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_type ENUM('kat_maliki', 'kiraci') NOT NULL,
    can_vote BOOLEAN NOT NULL DEFAULT FALSE,
    can_pay_dues BOOLEAN NOT NULL DEFAULT TRUE,
    can_create_ticket BOOLEAN NOT NULL DEFAULT TRUE,
    can_attend_meetings BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_type (user_type)
) ENGINE=InnoDB;

-- ============================================
-- 3. FINANCE: DUES & PAYMENTS
-- ============================================

-- Financial Periods
CREATE TABLE IF NOT EXISTS financial_periods (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    site_id CHAR(36) NOT NULL,
    year INT NOT NULL,
    month INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    closed_at TIMESTAMP NULL,
    closed_by CHAR(36),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    deleted_by CHAR(36),
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    UNIQUE KEY unique_period_per_site (site_id, year, month),
    CHECK (month >= 1 AND month <= 12)
) ENGINE=InnoDB;

-- Dues (indexler eklendi, CHECK constraint eklendi)
CREATE TABLE IF NOT EXISTS dues (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    financial_period_id CHAR(36) NOT NULL,
    apartment_id CHAR(36) NOT NULL,
    base_amount DECIMAL(10, 2) NOT NULL CHECK (base_amount >= 0),
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    currency_code VARCHAR(3) NOT NULL,
    due_date DATE NOT NULL,
    status ENUM('bekliyor', 'kismi_odendi', 'odendi', 'gecikmis', 'iptal_edildi') NOT NULL DEFAULT 'bekliyor',
    description TEXT,
    breakdown JSON,
    bank_name VARCHAR(100),
    iban VARCHAR(34),
    account_holder VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    deleted_by CHAR(36),
    FOREIGN KEY (financial_period_id) REFERENCES financial_periods(id) ON DELETE CASCADE,
    FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE,
    FOREIGN KEY (currency_code) REFERENCES currencies(code),
    INDEX idx_dues_apartment (apartment_id, due_date, status),
    INDEX idx_dues_finperiod (financial_period_id)
) ENGINE=InnoDB;

-- Installments (CHECK constraint eklendi)
CREATE TABLE IF NOT EXISTS installments (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    due_id CHAR(36) NOT NULL,
    installment_no INT NOT NULL CHECK (installment_no >= 1),
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    late_fee_amount DECIMAL(10, 2) DEFAULT 0,
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    deleted_by CHAR(36),
    FOREIGN KEY (due_id) REFERENCES dues(id) ON DELETE CASCADE,
    UNIQUE KEY unique_installment_per_due (due_id, installment_no)
) ENGINE=InnoDB;

-- Payments (site_id eklendi, indexler eklendi)
CREATE TABLE IF NOT EXISTS payments (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    due_id CHAR(36) NOT NULL,
    installment_id CHAR(36),
    user_id CHAR(36) NOT NULL,
    site_id CHAR(36),
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    system_commission_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    currency_code VARCHAR(3) NOT NULL,
    payment_method ENUM('kredi_karti', 'havale_eft', 'nakit', 'cek') NOT NULL,
    provider VARCHAR(50),
    provider_payment_id VARCHAR(255),
    idempotency_key VARCHAR(255) NOT NULL,
    status ENUM('bekliyor', 'isleniyor', 'tamamlandi', 'basarisiz', 'iade_edildi', 'iptal_edildi') NOT NULL DEFAULT 'bekliyor',
    metadata JSON,
    failure_reason TEXT,
    receipt_number VARCHAR(50) UNIQUE,
    receipt_pdf_url TEXT,
    payment_date TIMESTAMP NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    deleted_by CHAR(36),
    FOREIGN KEY (due_id) REFERENCES dues(id) ON DELETE RESTRICT,
    FOREIGN KEY (installment_id) REFERENCES installments(id) ON DELETE RESTRICT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE RESTRICT,
    FOREIGN KEY (currency_code) REFERENCES currencies(code),
    UNIQUE KEY unique_idempotency (idempotency_key),
    INDEX idx_payments_site (site_id),
    INDEX idx_payments_user_status (user_id, status, payment_date),
    INDEX idx_payments_due (due_id, status),
    INDEX idx_payments_provider (provider, provider_payment_id)
) ENGINE=InnoDB;

-- Payment Callbacks
CREATE TABLE IF NOT EXISTS payment_callbacks (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    payment_id CHAR(36) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    event VARCHAR(100) NOT NULL,
    raw_payload JSON NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'received',
    received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Late Fees
CREATE TABLE IF NOT EXISTS late_fees (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    due_id CHAR(36) NOT NULL,
    installment_id CHAR(36),
    penalty_rate DECIMAL(5, 2) NOT NULL,
    calculated_amount DECIMAL(10, 2) NOT NULL,
    applied_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    waived_by CHAR(36),
    waiver_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    deleted_by CHAR(36),
    FOREIGN KEY (due_id) REFERENCES dues(id) ON DELETE CASCADE,
    FOREIGN KEY (installment_id) REFERENCES installments(id)
) ENGINE=InnoDB;

-- Refunds
CREATE TABLE IF NOT EXISTS refunds (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    payment_id CHAR(36) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    provider_refund_id VARCHAR(255),
    processed_at TIMESTAMP NULL,
    processed_by CHAR(36),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payments(id)
) ENGINE=InnoDB;

-- Ledger Entries
CREATE TABLE IF NOT EXISTS ledger_entries (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    site_id CHAR(36) NOT NULL,
    type VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency_code VARCHAR(3) NOT NULL,
    related_entity_type VARCHAR(50),
    related_entity_id CHAR(36),
    description TEXT,
    transaction_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    deleted_by CHAR(36),
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    FOREIGN KEY (currency_code) REFERENCES currencies(code)
) ENGINE=InnoDB;

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    site_id CHAR(36) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency_code VARCHAR(3) NOT NULL,
    category VARCHAR(50) NOT NULL,
    vendor VARCHAR(255),
    invoice_number VARCHAR(100),
    expense_date DATE NOT NULL,
    description TEXT,
    attachment_id CHAR(36),
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    approved_by CHAR(36),
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    deleted_by CHAR(36),
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    FOREIGN KEY (currency_code) REFERENCES currencies(code)
) ENGINE=InnoDB;

-- ============================================
-- BANK ACCOUNTS & PAYMENT PROVIDERS (TEKİLLEŞTİRİLDİ)
-- ============================================

-- Site Bank Accounts (IBAN bilgileri için)
CREATE TABLE IF NOT EXISTS site_bank_accounts (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    site_id CHAR(36) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    iban VARCHAR(34) NOT NULL,
    account_holder VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    deleted_by CHAR(36),
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Payment Providers (Virtual POS / Bank API entegrasyonları)
CREATE TABLE IF NOT EXISTS payment_providers (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    site_id CHAR(36) NOT NULL,
    provider_name VARCHAR(50) NOT NULL,
    provider_type ENUM('virtual_pos','bank_transfer','cash','check') NOT NULL,
    api_key TEXT,
    secret_key TEXT,
    base_url TEXT,
    webhook_secret TEXT,
    commission_rate DECIMAL(5,2) DEFAULT 0,
    commission_fixed DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    deleted_by CHAR(36),
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    UNIQUE KEY unique_provider_per_site (site_id, provider_name)
) ENGINE=InnoDB;

-- Payment Provider Logs (Webhook callback güvenliği için)
CREATE TABLE IF NOT EXISTS payment_provider_logs (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    provider VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSON NOT NULL,
    signature_verified BOOLEAN DEFAULT FALSE,
    processed BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    INDEX idx_provider_logs_created (created_at),
    INDEX idx_provider_logs_processed (processed, created_at)
) ENGINE=InnoDB;

-- Announcements (indexler eklendi)
CREATE TABLE IF NOT EXISTS announcements (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    site_id CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    target_audience VARCHAR(50) NOT NULL DEFAULT 'herkes',
    priority ENUM('dusuk', 'orta', 'yuksek', 'acil') NOT NULL DEFAULT 'orta',
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    deleted_by CHAR(36),
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    INDEX idx_announcements_site_published (site_id, published_at),
    FULLTEXT INDEX ft_announcements_search (title, body)
) ENGINE=InnoDB;

-- Announcement Reads
CREATE TABLE IF NOT EXISTS announcement_reads (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    announcement_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    read_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_read_per_user (announcement_id, user_id)
) ENGINE=InnoDB;

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    related_entity_type VARCHAR(50),
    related_entity_id CHAR(36),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- SMS Logs
CREATE TABLE IF NOT EXISTS sms_logs (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36),
    phone_number VARCHAR(20) NOT NULL,
    message_body TEXT NOT NULL,
    provider VARCHAR(50),
    provider_message_id VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    error_message TEXT,
    sent_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    retry_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Notification Settings
CREATE TABLE IF NOT EXISTS notification_settings (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL UNIQUE,
    push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sms_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    announcement_push BOOLEAN NOT NULL DEFAULT TRUE,
    payment_reminders BOOLEAN NOT NULL DEFAULT TRUE,
    ticket_updates BOOLEAN NOT NULL DEFAULT TRUE,
    vote_reminders BOOLEAN NOT NULL DEFAULT TRUE,
    meeting_reminders BOOLEAN NOT NULL DEFAULT TRUE,
    custom_preferences JSON,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Conversations (indexler eklendi)
CREATE TABLE IF NOT EXISTS conversations (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    site_id CHAR(36) NOT NULL,
    conversation_type ENUM('resident_security', 'resident_admin', 'direct') NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    INDEX idx_conversations_site_type (site_id, conversation_type)
) ENGINE=InnoDB;

-- Conversation Participants (Sohbet katılımcıları)
CREATE TABLE IF NOT EXISTS conversation_participants (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    conversation_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    role ENUM('resident', 'security', 'admin') NOT NULL,
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_participant (conversation_id, user_id)
) ENGINE=InnoDB;

-- Messages (indexler eklendi)
CREATE TABLE IF NOT EXISTS messages (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    conversation_id CHAR(36) NOT NULL,
    sender_id CHAR(36) NOT NULL,
    message_type ENUM('text', 'image', 'file', 'system') NOT NULL DEFAULT 'text',
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_messages_conv_sent (conversation_id, sent_at)
) ENGINE=InnoDB;

-- ============================================
-- 5. OPERATIONS
-- ============================================

-- Tickets (site_id index eklendi)
CREATE TABLE IF NOT EXISTS tickets (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    ticket_number VARCHAR(50) NOT NULL UNIQUE,
    user_id CHAR(36) NOT NULL,
    apartment_id CHAR(36),
    site_id CHAR(36) NOT NULL,
    assigned_to CHAR(36),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50),
    status ENUM('acik', 'islemde', 'kullanici_bekleniyor', 'cozuldu', 'kapali', 'reddedildi') NOT NULL DEFAULT 'acik',
    priority ENUM('dusuk', 'orta', 'yuksek', 'acil') NOT NULL DEFAULT 'orta',
    resolution_note TEXT,
    resolved_at TIMESTAMP NULL,
    resolved_by CHAR(36),
    closed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    deleted_by CHAR(36),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE RESTRICT,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_tickets_site_status (site_id, status, priority),
    FULLTEXT INDEX ft_tickets_search (title, description)
) ENGINE=InnoDB;

-- SLA Alerts
CREATE TABLE IF NOT EXISTS sla_alerts (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    ticket_id CHAR(36) NOT NULL,
    alert_level ENUM('warning', 'breached') NOT NULL,
    deadline TIMESTAMP NOT NULL,
    is_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    acknowledged_by CHAR(36),
    acknowledged_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (acknowledged_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- Ticket Activity Log
CREATE TABLE IF NOT EXISTS ticket_activity_log (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    ticket_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    site_id CHAR(36) NOT NULL,
    assigned_to CHAR(36),
    task_type VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    due_date DATE,
    status ENUM('bekliyor', 'devam_ediyor', 'tamamlandi', 'iptal_edildi') NOT NULL DEFAULT 'bekliyor',
    completion_proof_url TEXT,
    completion_notes TEXT,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    deleted_at TIMESTAMP NULL,
    deleted_by CHAR(36),
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id)
) ENGINE=InnoDB;

-- Packages (indexler eklendi)
CREATE TABLE IF NOT EXISTS packages (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    apartment_id CHAR(36) NOT NULL,
    courier_name VARCHAR(100),
    tracking_number VARCHAR(100),
    sender_name VARCHAR(255),
    recipient_name VARCHAR(255),
    package_size VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'received',
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    recorded_by CHAR(36),
    notified_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    delivered_to CHAR(36),
    notify_conversation_id CHAR(36),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    deleted_by CHAR(36),
    FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (delivered_to) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (notify_conversation_id) REFERENCES conversations(id) ON DELETE SET NULL,
    INDEX idx_packages_apartment (apartment_id, status),
    INDEX idx_packages_delivered_to (delivered_to)
) ENGINE=InnoDB;

-- Visitors
CREATE TABLE IF NOT EXISTS visitors (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    apartment_id CHAR(36) NOT NULL,
    site_id CHAR(36) NOT NULL,
    visitor_name VARCHAR(255) NOT NULL,
    visitor_phone VARCHAR(20),
    visitor_id_number VARCHAR(50),
    vehicle_plate VARCHAR(20),
    purpose TEXT,
    expected_at TIMESTAMP NULL,
    arrived_at TIMESTAMP NULL,
    left_at TIMESTAMP NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'expected',
    authorized_by CHAR(36),
    checked_in_by CHAR(36),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    deleted_by CHAR(36),
    FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    FOREIGN KEY (authorized_by) REFERENCES users(id),
    FOREIGN KEY (checked_in_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- Staff Shifts
CREATE TABLE IF NOT EXISTS staff_shifts (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    site_id CHAR(36) NOT NULL,
    shift_type VARCHAR(20) NOT NULL,
    shift_date DATE NOT NULL,
    scheduled_start_time TIMESTAMP NOT NULL,
    scheduled_end_time TIMESTAMP NOT NULL,
    actual_check_in_time TIMESTAMP NULL,
    actual_check_out_time TIMESTAMP NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    deleted_at TIMESTAMP NULL,
    deleted_by CHAR(36),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- 6. GOVERNANCE
-- ============================================

-- Voting Topics
CREATE TABLE IF NOT EXISTS voting_topics (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    site_id CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    eligibility ENUM('sadece_kat_malikleri', 'tum_sakinler') NOT NULL,
    allowed_user_type ENUM('kat_maliki', 'tum_sakinler') NOT NULL DEFAULT 'kat_maliki',
    vote_type ENUM('evet_hayir', 'coktan_secmeli', 'siralama') NOT NULL,
    options JSON,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    quorum_required INT DEFAULT 50,
    total_eligible_voters INT DEFAULT 0,
    total_votes_cast INT DEFAULT 0,
    participation_rate DECIMAL(5, 2) DEFAULT 0,
    results JSON,
    winning_option VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    deleted_at TIMESTAMP NULL,
    deleted_by CHAR(36),
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Votes
CREATE TABLE IF NOT EXISTS votes (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    voting_topic_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    vote_value VARCHAR(255) NOT NULL,
    vote_hash VARCHAR(255),
    voted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    FOREIGN KEY (voting_topic_id) REFERENCES voting_topics(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_vote_per_topic (voting_topic_id, user_id)
) ENGINE=InnoDB;

-- Meetings
CREATE TABLE IF NOT EXISTS meetings (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    site_id CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    meeting_type ENUM('genel_kurul', 'yonetim_kurulu', 'acil_durum', 'diger') NOT NULL,
    scheduled_at TIMESTAMP NOT NULL,
    end_time TIMESTAMP NULL,
    location VARCHAR(255),
    eligibility VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    quorum_required INT DEFAULT 50,
    minutes_content TEXT,
    decisions JSON,
    action_items JSON,
    attendees_count INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    deleted_at TIMESTAMP NULL,
    deleted_by CHAR(36),
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Meeting Participants
CREATE TABLE IF NOT EXISTS meeting_participants (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    meeting_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'invited',
    confirmed_at TIMESTAMP NULL,
    attended_at TIMESTAMP NULL,
    role VARCHAR(20) DEFAULT 'participant',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_participant_per_meeting (meeting_id, user_id)
) ENGINE=InnoDB;

-- ============================================
-- 7. SUPPORT & OTHERS
-- ============================================

-- Common Area Reservations
CREATE TABLE IF NOT EXISTS common_area_reservations (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    common_area_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    apartment_id CHAR(36) NOT NULL,
    reservation_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    fee DECIMAL(10, 2),
    currency_code VARCHAR(3),
    approved_by CHAR(36),
    rejection_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    deleted_by CHAR(36),
    FOREIGN KEY (common_area_id) REFERENCES common_areas(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (apartment_id) REFERENCES apartments(id),
    FOREIGN KEY (currency_code) REFERENCES currencies(code)
) ENGINE=InnoDB;

-- Emergency Records
CREATE TABLE IF NOT EXISTS emergency_records (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    site_id CHAR(36) NOT NULL,
    reported_by CHAR(36),
    emergency_type ENUM('yangin', 'saglik', 'guvenlik', 'kaza', 'dogal_afet', 'diger') NOT NULL,
    severity ENUM('dusuk', 'orta', 'yuksek', 'acil') NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255),
    occurred_at TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'reported',
    resolved_by CHAR(36),
    resolution_note TEXT,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    deleted_by CHAR(36),
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_by) REFERENCES users(id),
    FOREIGN KEY (resolved_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- Attachments (site_id ve indexler eklendi)
CREATE TABLE IF NOT EXISTS attachments (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    site_id CHAR(36),
    related_entity_type VARCHAR(50) NOT NULL,
    related_entity_id CHAR(36) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    storage_key TEXT,
    file_type VARCHAR(50),
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    uploaded_by CHAR(36),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    deleted_by CHAR(36),
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_attachments_related (related_entity_type, related_entity_id),
    INDEX idx_attachments_site (site_id)
) ENGINE=InnoDB;

-- Notes (site_id eklendi)
CREATE TABLE IF NOT EXISTS notes (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    site_id CHAR(36),
    related_entity_type VARCHAR(50),
    related_entity_id CHAR(36),
    title VARCHAR(255),
    note_text TEXT NOT NULL,
    is_private BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    deleted_by CHAR(36),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Audit Logs (indexler eklendi)
CREATE TABLE IF NOT EXISTS audit_logs (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36),
    action VARCHAR(50) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    entity_id CHAR(36),
    changes JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_created (created_at),
    INDEX idx_audit_entity (entity, entity_id)
) ENGINE=InnoDB;

-- ============================================
-- INDEXES FOR MULTI-TENANT ISOLATION
-- ============================================

-- User Site Memberships Index (Multi-tenant isolation için)
-- Note: MySQL'de CREATE INDEX IF NOT EXISTS desteklenmez, bu yüzden ALTER TABLE kullanıyoruz
SET @index_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE table_schema = DATABASE() 
    AND table_name = 'user_site_memberships' 
    AND index_name = 'idx_user_site_active'
);
SET @sql = IF(@index_exists = 0, 
    'CREATE INDEX idx_user_site_active ON user_site_memberships (user_id, site_id, status)',
    'SELECT "Index idx_user_site_active already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Users Index (Soft delete kontrolü için)
SET @index_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE table_schema = DATABASE() 
    AND table_name = 'users' 
    AND index_name = 'idx_site_isolation'
);
SET @sql = IF(@index_exists = 0, 
    'CREATE INDEX idx_site_isolation ON users (id, is_deleted)',
    'SELECT "Index idx_site_isolation already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- ALTER EXISTING TABLES (Mevcut tablolara kolon ekleme)
-- ============================================

-- Voting Topics: allowed_user_type kolonu ekle (eğer yoksa)
SET @dbname = DATABASE();
SET @tablename = 'voting_topics';
SET @columnname = 'allowed_user_type';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT "Column allowed_user_type already exists in voting_topics table" AS message;',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' ENUM(\'kat_maliki\', \'tum_sakinler\') NOT NULL DEFAULT \'kat_maliki\' AFTER eligibility;')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Packages: notify_conversation_id kolonu ekle (eğer yoksa)
SET @tablename = 'packages';
SET @columnname = 'notify_conversation_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT "Column notify_conversation_id already exists in packages table" AS message;',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' CHAR(36) AFTER delivered_to, ADD FOREIGN KEY (', @columnname, ') REFERENCES conversations(id) ON DELETE SET NULL;')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================
-- SEED DATA
-- ============================================

INSERT IGNORE INTO currencies (code, name, symbol, decimals) VALUES
('USD', 'Amerikan Doları', '$', 2),
('EUR', 'Euro', '€', 2),
('TRY', 'Türk Lirası', '₺', 2),
('GBP', 'İngiliz Sterlini', '£', 2);

-- Resident Permissions Seed Data
INSERT IGNORE INTO resident_permissions (user_type, can_vote, can_pay_dues, can_create_ticket, can_attend_meetings) VALUES
('kat_maliki', TRUE, TRUE, TRUE, TRUE),
('kiraci', FALSE, TRUE, TRUE, TRUE);

INSERT IGNORE INTO roles (name, description, scope) VALUES
('Yonetici', 'Tam yetkili site yoneticisi', 'site'),
('Sakin', 'Site sakini (kat maliki veya kiraci)', 'site'),
('Temizlik Personeli', 'Temizlik isleri sorumlusu', 'site'),
('Guvenlik', 'Guvenlik personeli', 'site'),
('Sistem Yoneticisi', 'Sistem genel yoneticisi', 'system');

-- Permissions (Generated from requirements)
INSERT IGNORE INTO permissions (resource, action, permission_name, description) VALUES
-- Sites
('sites', 'create', 'sites.create', 'Site oluşturma'),
('sites', 'update', 'sites.update', 'Site güncelleme'),
('sites', 'delete', 'sites.delete', 'Site silme'),
-- Blocks/Apts
('blocks', 'create', 'blocks.create', 'Blok oluşturma'),
('blocks', 'update', 'blocks.update', 'Blok güncelleme'),
('blocks', 'delete', 'blocks.delete', 'Blok silme'),
('apartments', 'create', 'apartments.create', 'Daire oluşturma'),
('apartments', 'update', 'apartments.update', 'Daire güncelleme'),
('apartments', 'delete', 'apartments.delete', 'Daire silme'),
-- Users
('users', 'invite', 'users.invite', 'Kullanıcı davet etme'),
('users', 'assignApartment', 'users.assignApartment', 'Kullanıcıyı daireye atama'),
('users', 'updateRole', 'users.updateRole', 'Kullanıcı rolü güncelleme'),
('users', 'deactivate', 'users.deactivate', 'Kullanıcıyı pasife alma'),
-- Dues
('dues', 'create', 'dues.create', 'Aidat oluşturma'),
('dues', 'bulkCreate', 'dues.bulkCreate', 'Toplu aidat oluşturma'),
('dues', 'update', 'dues.update', 'Aidat güncelleme'),
('dues', 'delete', 'dues.delete', 'Aidat silme'),
-- Installments
('installments', 'create', 'installments.create', 'Taksit oluşturma'),
('installments', 'update', 'installments.update', 'Taksit güncelleme'),
-- Payments
('payments', 'viewAll', 'payments.viewAll', 'Tüm ödemeleri görüntüleme'),
('payments', 'refund', 'payments.refund', 'Ödeme iadesi'),
('payments', 'reconcile', 'payments.reconcile', 'Banka mutabakatı'),
-- Ledger
('ledger', 'read', 'ledger.read', 'Defter kayıtlarını okuma'),
('ledger', 'write', 'ledger.write', 'Defter kaydı girme'),
('ledger', 'export', 'ledger.export', 'Defter dökümü alma'),
-- Reports
('reports', 'generate', 'reports.generate', 'Rapor oluşturma'),
-- Tickets
('tickets', 'manage', 'tickets.manage', 'Talepleri yönetme'),
('tickets', 'create', 'tickets.create', 'Talep oluşturma'),
-- Tasks
('tasks', 'create', 'tasks.create', 'Görev oluşturma'),
('tasks', 'assign', 'tasks.assign', 'Görev atama'),
('tasks', 'verify', 'tasks.verify', 'Görev doğrulama'),
('tasks', 'read.assigned', 'tasks.read.assigned', 'Kendi görevlerini görme'),
('tasks', 'complete', 'tasks.complete', 'Görevi tamamlama'),
-- Announcements
('announcements', 'create', 'announcements.create', 'Duyuru oluşturma'),
('announcements', 'publish', 'announcements.publish', 'Duyuru yayınlama'),
('announcements', 'retract', 'announcements.retract', 'Duyuru yayından kaldırma'),
('announcements', 'read', 'announcements.read', 'Duyuru okuma'),
-- Votes
('votes', 'create', 'votes.create', 'Oylama oluşturma'),
('votes', 'close', 'votes.close', 'Oylama sonlandırma'),
('votes', 'export', 'votes.export', 'Oylama sonucu alma'),
('votes', 'view', 'votes.view', 'Oylamaları görme'),
('votes', 'cast', 'votes.cast', 'Oy kullanma'),
-- Meetings
('meetings', 'create', 'meetings.create', 'Toplantı oluşturma'),
('meetings', 'invite', 'meetings.invite', 'Toplantı daveti'),
('meetings', 'minutes', 'meetings.minutes', 'Toplantı tutanağı'),
('meetings', 'view', 'meetings.view', 'Toplantı görme'),
('meetings', 'rsvp', 'meetings.rsvp', 'Toplantı katılımı'),
-- Packages
('packages', 'view', 'packages.view', 'Paketleri görme'),
('packages', 'create', 'packages.create', 'Paket kaydı'),
('packages', 'update', 'packages.update', 'Paket güncelleme'),
-- Visitors
('visitors', 'log', 'visitors.log', 'Ziyaretçi kaydı'),
-- Emergency
('emergency', 'alert', 'emergency.alert', 'Acil durum alarmı'),
-- Shifts
('shifts', 'view', 'shifts.view', 'Vardiya görme'),
-- Notes
('notes', 'create', 'notes.create', 'Not/Rapor oluşturma'),
-- Messaging
('messages', 'send', 'messages.send', 'Mesaj gönderme'),
('messages', 'read', 'messages.read', 'Mesaj okuma'),
('conversations', 'create', 'conversations.create', 'Sohbet oluşturma'),
('conversations', 'view', 'conversations.view', 'Sohbet görüntüleme'),
-- Profile/Common
('profile', 'read', 'profile.read', 'Profil görüntüleme'),
('profile', 'update', 'profile.update', 'Profil güncelleme'),
('notifications', 'read', 'notifications.read', 'Bildirim okuma'),
-- System
('pdf', 'generate', 'pdf.generate', 'PDF üretme'),
('email', 'send', 'email.send', 'E-posta gönderme'),
('sms', 'send', 'sms.send', 'SMS gönderme'),
('jobs', 'execute', 'jobs.execute', 'Job çalıştırma'),
('exchange_rates', 'fetch', 'exchange_rates.fetch', 'Kur çekme'),
('audit', 'view', 'audit.view', 'Logları görme'),
('settings', 'update', 'settings.update', 'Ayarları güncelleme');

-- Assign Permissions to Roles (Example: Admin gets creating sites)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'Yonetici' AND p.permission_name IN (
    'sites.create', 'sites.update', 'sites.delete',
    'blocks.create', 'blocks.update', 'blocks.delete',
    'apartments.create', 'apartments.update', 'apartments.delete',
    'users.invite', 'users.assignApartment', 'users.updateRole', 'users.deactivate',
    'dues.create', 'dues.bulkCreate', 'dues.update', 'dues.delete',
    'installments.create', 'installments.update',
    'payments.viewAll', 'payments.refund', 'payments.reconcile',
    'ledger.read', 'ledger.write', 'ledger.export',
    'reports.generate', 'tickets.manage',
    'tasks.create', 'tasks.assign', 'tasks.verify',
    'announcements.create', 'announcements.publish', 'announcements.retract',
    'votes.create', 'votes.close', 'votes.export',
    'meetings.create', 'meetings.invite', 'meetings.minutes',
    'audit.view', 'settings.update'
);

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- BACKFILL site_id FOR PAYMENTS
-- ============================================
-- Payments tablosuna site_id backfill (mevcut veriler için)
UPDATE payments p
JOIN dues d ON p.due_id = d.id
JOIN financial_periods fp ON d.financial_period_id = fp.id
SET p.site_id = fp.site_id
WHERE p.site_id IS NULL;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT 'Database schema created/updated successfully!' AS message;
SELECT 'All duplicate tables removed and indexes added!' AS message;