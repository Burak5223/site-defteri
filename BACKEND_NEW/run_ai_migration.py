#!/usr/bin/env python3
"""Execute AI Cargo migration SQL statements one by one"""

import mysql.connector
import sys
import re

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'Hilton5252.',
    'database': 'smart_site_management'
}

# SQL statements split manually
STATEMENTS = [
    # Create resident_cargo_notifications table
    """CREATE TABLE IF NOT EXISTS resident_cargo_notifications (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        resident_id CHAR(36) NOT NULL,
        site_id CHAR(36) NOT NULL,
        apartment_id CHAR(36) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        full_name_normalized VARCHAR(255) NOT NULL COMMENT 'Turkish character normalized for matching',
        cargo_company VARCHAR(255),
        expected_date DATE,
        status VARCHAR(50) NOT NULL DEFAULT 'pending_match' COMMENT 'pending_match, matched, expired',
        matched_package_id VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        matched_at TIMESTAMP NULL,
        
        FOREIGN KEY (resident_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
        FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE,
        FOREIGN KEY (matched_package_id) REFERENCES packages(id) ON DELETE SET NULL,
        
        INDEX idx_status (status),
        INDEX idx_resident_id (resident_id),
        INDEX idx_full_name_normalized (full_name_normalized),
        INDEX idx_created_at (created_at),
        INDEX idx_site_id (site_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci""",
    
    # Create ai_extraction_logs table
    """CREATE TABLE IF NOT EXISTS ai_extraction_logs (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        site_id CHAR(36) NOT NULL,
        security_user_id CHAR(36) NOT NULL,
        photo_path VARCHAR(500) COMMENT 'Path to uploaded cargo slip photo',
        gemini_raw_response TEXT COMMENT 'Raw JSON response from Gemini Vision API',
        extraction_success BOOLEAN NOT NULL,
        api_response_time_ms INT COMMENT 'API response time in milliseconds',
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        photo_deleted_at TIMESTAMP NULL COMMENT 'KVKK compliance - photo deletion timestamp',
        
        FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
        FOREIGN KEY (security_user_id) REFERENCES users(id) ON DELETE CASCADE,
        
        INDEX idx_site_id (site_id),
        INDEX idx_created_at (created_at),
        INDEX idx_extraction_success (extraction_success),
        INDEX idx_security_user_id (security_user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci""",
    
    # Add foreign keys (packages table already has the columns from previous run)
    """ALTER TABLE packages
    ADD CONSTRAINT fk_packages_ai_extraction_log 
        FOREIGN KEY (ai_extraction_log_id) REFERENCES ai_extraction_logs(id) ON DELETE SET NULL""",
    
    """ALTER TABLE packages
    ADD CONSTRAINT fk_packages_matched_notification 
        FOREIGN KEY (matched_notification_id) REFERENCES resident_cargo_notifications(id) ON DELETE SET NULL""",
]

def main():
    print("="*60)
    print("AI CARGO REGISTRATION - DATABASE MIGRATION")
    print("="*60)
    
    try:
        print("\nConnecting to database...")
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        print("✓ Connected successfully\n")
        
        success_count = 0
        skip_count = 0
        error_count = 0
        
        for i, stmt in enumerate(STATEMENTS, 1):
            try:
                cursor.execute(stmt)
                print(f"✓ Statement {i}/{len(STATEMENTS)} executed")
                success_count += 1
            except mysql.connector.Error as err:
                if err.errno == 1060:  # Duplicate column
                    print(f"⚠ Statement {i}/{len(STATEMENTS)} skipped (column exists)")
                    skip_count += 1
                elif err.errno == 1061:  # Duplicate key name
                    print(f"⚠ Statement {i}/{len(STATEMENTS)} skipped (index exists)")
                    skip_count += 1
                elif err.errno == 1050:  # Table already exists
                    print(f"⚠ Statement {i}/{len(STATEMENTS)} skipped (table exists)")
                    skip_count += 1
                else:
                    print(f"✗ Statement {i}/{len(STATEMENTS)} failed: {err}")
                    error_count += 1
        
        conn.commit()
        
        print(f"\n{'='*60}")
        print(f"Summary: {success_count} executed, {skip_count} skipped, {error_count} errors")
        print(f"{'='*60}\n")
        
        # Verify tables
        print("Verifying tables...")
        cursor.execute("SHOW TABLES LIKE 'resident_cargo_notifications'")
        if cursor.fetchone():
            print("✓ resident_cargo_notifications table exists")
        else:
            print("✗ resident_cargo_notifications table NOT FOUND")
        
        cursor.execute("SHOW TABLES LIKE 'ai_extraction_logs'")
        if cursor.fetchone():
            print("✓ ai_extraction_logs table exists")
        else:
            print("✗ ai_extraction_logs table NOT FOUND")
        
        cursor.execute("SHOW COLUMNS FROM packages LIKE 'ai_extracted'")
        if cursor.fetchone():
            print("✓ packages.ai_extracted column exists")
        else:
            print("✗ packages.ai_extracted column NOT FOUND")
        
        cursor.execute("SHOW COLUMNS FROM packages LIKE 'ai_extraction_log_id'")
        if cursor.fetchone():
            print("✓ packages.ai_extraction_log_id column exists")
        else:
            print("✗ packages.ai_extraction_log_id column NOT FOUND")
        
        print("\n✓ Migration completed successfully!")
        
        cursor.close()
        conn.close()
        return 0
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
