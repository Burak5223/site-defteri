#!/usr/bin/env python3
"""
Comprehensive System Health Check
Tests all major systems for errors
"""

import requests
import mysql.connector
from datetime import datetime

BASE_URL = "http://localhost:8080/api"

def print_header(title):
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}\n")

def check_backend_health():
    """Check if backend is running"""
    print_header("1. BACKEND HEALTH CHECK")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        print("✓ Backend is running")
        return True
    except:
        try:
            # Try login endpoint as alternative
            response = requests.post(f"{BASE_URL}/auth/login", json={}, timeout=5)
            print("✓ Backend is running (via auth endpoint)")
            return True
        except:
            print("✗ Backend is NOT running")
            return False

def check_database():
    """Check database connection and tables"""
    print_header("2. DATABASE CHECK")
    try:
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='Hilton5252.',
            database='smart_site_management'
        )
        cursor = conn.cursor(dictionary=True)
        
        # Check critical tables
        tables = [
            'users', 'sites', 'apartments', 'residency_history',
            'dues', 'payments', 'packages', 'notifications',
            'messages', 'tickets', 'tasks', 'visitor_requests',
            'user_fcm_tokens', 'financial_periods'
        ]
        
        missing_tables = []
        for table in tables:
            cursor.execute(f"SHOW TABLES LIKE '{table}'")
            if not cursor.fetchone():
                missing_tables.append(table)
        
        if missing_tables:
            print(f"✗ Missing tables: {', '.join(missing_tables)}")
            conn.close()
            return False
        else:
            print(f"✓ All {len(tables)} critical tables exist")
            conn.close()
            return True
            
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False

def check_authentication():
    """Test authentication system"""
    print_header("3. AUTHENTICATION SYSTEM")
    
    test_users = [
        ("sakin1@yeşilvadisitesi.com", "123456", "Resident"),
        ("admin@yeşilvadisitesi.com", "123456", "Admin"),
        ("guvenlik@yeşilvadisitesi.com", "123456", "Security"),
    ]
    
    all_passed = True
    for email, password, role in test_users:
        try:
            response = requests.post(
                f"{BASE_URL}/auth/login",
                json={"email": email, "password": password},
                timeout=5
            )
            if response.status_code == 200:
                print(f"✓ {role} login successful")
            else:
                print(f"✗ {role} login failed: {response.status_code}")
                all_passed = False
        except Exception as e:
            print(f"✗ {role} login error: {e}")
            all_passed = False
    
    return all_passed

def check_kargom_var_system():
    """Test Kargom Var notification system"""
    print_header("4. KARGOM VAR SYSTEM")
    
    try:
        # Login as resident
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": "sakin1@şehirmerkeziresidence.com", "password": "123456"}
        )
        token = response.json()["accessToken"]
        site_id = response.json()["siteId"]
        
        # Check packages endpoint
        response = requests.get(
            f"{BASE_URL}/sites/{site_id}/packages",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 200:
            packages = response.json()
            requested = [p for p in packages if p.get('status') == 'requested']
            print(f"✓ Package system working")
            print(f"  - Total packages: {len(packages)}")
            print(f"  - Requested packages: {len(requested)}")
            return True
        else:
            print(f"✗ Package endpoint failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"✗ Kargom Var system error: {e}")
        return False

def check_receipt_system():
    """Test receipt/makbuz system"""
    print_header("5. RECEIPT/MAKBUZ SYSTEM")
    
    try:
        # Login as resident
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": "sakin1@şehirmerkeziresidence.com", "password": "123456"}
        )
        token = response.json()["accessToken"]
        site_id = response.json()["siteId"]
        
        # Check dues endpoint
        response = requests.get(
            f"{BASE_URL}/sites/{site_id}/dues",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 200:
            dues = response.json()
            paid_dues = [d for d in dues if d.get('status') == 'paid']
            
            # Check status mapping
            status_correct = all(d.get('status') in ['paid', 'unpaid', 'partially_paid', 'overdue', 'cancelled'] for d in dues)
            
            if status_correct:
                print(f"✓ Receipt system working")
                print(f"  - Total dues: {len(dues)}")
                print(f"  - Paid dues: {len(paid_dues)}")
                print(f"  - Status mapping: CORRECT")
                return True
            else:
                print(f"✗ Status mapping incorrect")
                return False
        else:
            print(f"✗ Dues endpoint failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"✗ Receipt system error: {e}")
        return False

def check_messaging_system():
    """Test messaging system"""
    print_header("6. MESSAGING SYSTEM")
    
    try:
        # Login as admin
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": "admin@yeşilvadisitesi.com", "password": "123456"}
        )
        token = response.json()["accessToken"]
        site_id = response.json()["siteId"]
        
        # Check messages endpoint
        response = requests.get(
            f"{BASE_URL}/sites/{site_id}/messages",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 200:
            print(f"✓ Messaging system working")
            messages = response.json()
            print(f"  - Total messages: {len(messages)}")
            return True
        else:
            print(f"✗ Messages endpoint failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"✗ Messaging system error: {e}")
        return False

def check_visitor_system():
    """Test visitor request system"""
    print_header("7. VISITOR REQUEST SYSTEM")
    
    try:
        # Login as security
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": "guvenlik@yeşilvadisitesi.com", "password": "123456"}
        )
        token = response.json()["accessToken"]
        site_id = response.json()["siteId"]
        
        # Check visitor requests endpoint
        response = requests.get(
            f"{BASE_URL}/sites/{site_id}/visitor-requests",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 200:
            print(f"✓ Visitor system working")
            requests_data = response.json()
            print(f"  - Total visitor requests: {len(requests_data)}")
            return True
        else:
            print(f"✗ Visitor requests endpoint failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"✗ Visitor system error: {e}")
        return False

def check_notification_system():
    """Test notification system"""
    print_header("8. NOTIFICATION SYSTEM")
    
    try:
        # Login as resident
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": "sakin1@şehirmerkeziresidence.com", "password": "123456"}
        )
        token = response.json()["accessToken"]
        user_id = response.json()["userId"]
        
        # Check notifications endpoint
        response = requests.get(
            f"{BASE_URL}/users/{user_id}/notifications",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 200:
            print(f"✓ Notification system working")
            notifications = response.json()
            print(f"  - Total notifications: {len(notifications)}")
            return True
        else:
            print(f"✗ Notifications endpoint failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"✗ Notification system error: {e}")
        return False

def check_known_issues():
    """Check for known issues"""
    print_header("9. KNOWN ISSUES CHECK")
    
    issues = []
    
    try:
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='Hilton5252.',
            database='smart_site_management'
        )
        cursor = conn.cursor(dictionary=True)
        
        # Check for users without site_id
        cursor.execute("SELECT COUNT(*) as count FROM users WHERE site_id IS NULL")
        result = cursor.fetchone()
        if result['count'] > 0:
            issues.append(f"⚠ {result['count']} users without site_id")
        
        # Check for apartments without site_id
        cursor.execute("SELECT COUNT(*) as count FROM apartments WHERE site_id IS NULL")
        result = cursor.fetchone()
        if result['count'] > 0:
            issues.append(f"⚠ {result['count']} apartments without site_id")
        
        # Check for orphaned residency records
        cursor.execute("""
            SELECT COUNT(*) as count FROM residency_history rh
            LEFT JOIN users u ON rh.user_id = u.id
            WHERE u.id IS NULL
        """)
        result = cursor.fetchone()
        if result['count'] > 0:
            issues.append(f"⚠ {result['count']} orphaned residency records")
        
        conn.close()
        
        if issues:
            for issue in issues:
                print(issue)
            return False
        else:
            print("✓ No known issues detected")
            return True
            
    except Exception as e:
        print(f"✗ Issue check failed: {e}")
        return False

def main():
    print("\n" + "="*70)
    print("  COMPREHENSIVE SYSTEM HEALTH CHECK")
    print("  " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print("="*70)
    
    results = {
        "Backend Health": check_backend_health(),
        "Database": check_database(),
        "Authentication": check_authentication(),
        "Kargom Var System": check_kargom_var_system(),
        "Receipt System": check_receipt_system(),
        "Messaging System": check_messaging_system(),
        "Visitor System": check_visitor_system(),
        "Notification System": check_notification_system(),
        "Known Issues": check_known_issues()
    }
    
    # Summary
    print_header("SUMMARY")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for system, status in results.items():
        status_icon = "✓" if status else "✗"
        print(f"{status_icon} {system}")
    
    print(f"\n{'='*70}")
    print(f"  OVERALL: {passed}/{total} systems passing")
    
    if passed == total:
        print(f"  STATUS: ✓ ALL SYSTEMS OPERATIONAL")
    elif passed >= total * 0.8:
        print(f"  STATUS: ⚠ MOSTLY OPERATIONAL (minor issues)")
    else:
        print(f"  STATUS: ✗ CRITICAL ISSUES DETECTED")
    
    print(f"{'='*70}\n")

if __name__ == "__main__":
    main()
