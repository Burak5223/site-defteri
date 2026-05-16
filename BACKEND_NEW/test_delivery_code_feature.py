#!/usr/bin/env python3
"""
Test Delivery Code Feature
Tests both resident and security sides of the delivery code feature
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8080/api"
RESIDENT_EMAIL = "sakin@site.com"
RESIDENT_PASSWORD = "sakin123"
SECURITY_EMAIL = "guvenlik@site.com"
SECURITY_PASSWORD = "guvenlik123"

def print_section(title):
    """Print a section header"""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)

def print_step(step, description):
    """Print a test step"""
    print(f"\n{step}. {description}")

def print_success(message):
    """Print success message"""
    print(f"   ✓ {message}")

def print_error(message):
    """Print error message"""
    print(f"   ✗ {message}")

def print_info(message):
    """Print info message"""
    print(f"   ℹ {message}")

def login(email, password):
    """Login and get token"""
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": email, "password": password}
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('accessToken')  # Changed from 'token' to 'accessToken'
            user_data = data.get('user', {})
            print_success(f"Logged in as {email}")
            print_info(f"User ID: {user_data.get('id')}")
            if user_data.get('role'):
                print_info(f"Role: {user_data.get('role')}")
            if user_data.get('apartmentId'):
                print_info(f"Apartment ID: {user_data.get('apartmentId')}")
            return token, user_data
        else:
            print_error(f"Login failed: {response.status_code}")
            print_error(f"Response: {response.text}")
            return None, None
    except Exception as e:
        print_error(f"Login error: {e}")
        return None, None

def create_resident_notification(token, user_data, delivery_code=None):
    """Create resident cargo notification with optional delivery code"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        payload = {
            "residentId": user_data.get('id'),
            "siteId": user_data.get('siteId'),
            "apartmentId": user_data.get('apartmentId'),
            "fullName": user_data.get('fullName', 'Test Sakin'),
            "cargoCompany": "Yurtiçi Kargo",
            "expectedDate": datetime.now().strftime("%Y-%m-%d")
        }
        
        if delivery_code:
            payload["deliveryCode"] = delivery_code
            print_info(f"Including delivery code: {delivery_code}")
        
        response = requests.post(
            f"{BASE_URL}/packages/resident-notification",
            headers=headers,
            json=payload
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success("Resident notification created")
            print_info(f"Notification ID: {data.get('notificationId')}")
            if delivery_code:
                print_info(f"✓ Delivery code saved: {delivery_code}")
            return data.get('notificationId')
        else:
            print_error(f"Failed to create notification: {response.status_code}")
            print_error(f"Response: {response.text}")
            return None
    except Exception as e:
        print_error(f"Create notification error: {e}")
        return None

def create_package_with_ai(token, user_data, apartment_id):
    """Simulate security creating package with AI (will match with notification)"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        payload = {
            "fullName": user_data.get('fullName', 'Test Sakin'),
            "cargoCompany": "Yurtiçi Kargo",
            "trackingNumber": "123456789",  # Numeric only
            "apartmentNumber": user_data.get('unitNumber', '36'),
            "date": datetime.now().strftime("%Y-%m-%d"),  # Add date
            "packageSize": "Orta",
            "siteId": user_data.get('siteId'),
            "aiExtracted": True
        }
        
        response = requests.post(
            f"{BASE_URL}/packages/save-cargo",
            headers=headers,
            json=payload
        )
        
        if response.status_code == 200 or response.status_code == 201:
            data = response.json()
            print_success("Package created by security")
            
            # SaveCargoResponse has different structure
            package_id = data.get('packageId')  # Changed from 'id' to 'packageId'
            status = data.get('status', 'unknown')
            delivery_code = data.get('deliveryCode')
            
            print_info(f"Package ID: {package_id}")
            print_info(f"Status: {status}")
            
            # Check if delivery code is present
            if delivery_code:
                print_success(f"🔐 DELIVERY CODE FOUND: {delivery_code}")
            else:
                print_info("No delivery code (expected if notification had no code)")
            
            return package_id, data
        else:
            print_error(f"Failed to create package: {response.status_code}")
            print_error(f"Response: {response.text}")
            return None, None
    except Exception as e:
        print_error(f"Create package error: {e}")
        return None, None

def get_package_details(token, package_id):
    """Get package details to verify delivery code"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(
            f"{BASE_URL}/packages/{package_id}",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success("Package details retrieved")
            print_info(f"Package ID: {data.get('id')}")
            print_info(f"Courier: {data.get('courierName')}")
            print_info(f"Status: {data.get('status')}")
            
            if data.get('deliveryCode'):
                print_success(f"🔐 Delivery Code: {data.get('deliveryCode')}")
            else:
                print_info("No delivery code")
            
            return data
        else:
            print_error(f"Failed to get package: {response.status_code}")
            return None
    except Exception as e:
        print_error(f"Get package error: {e}")
        return None

def initiate_delivery(token, package_id):
    """Security initiates delivery (should show delivery code alert in mobile app)"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.post(
            f"{BASE_URL}/packages/{package_id}/initiate-delivery",
            headers=headers
        )
        
        if response.status_code == 200:
            print_success("Delivery initiated")
            print_info("In mobile app, security should see delivery code alert now")
            return True
        else:
            print_error(f"Failed to initiate delivery: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
    except Exception as e:
        print_error(f"Initiate delivery error: {e}")
        return False

def run_test_scenario_with_code():
    """Test Scenario 1: Resident creates notification WITH delivery code"""
    print_section("TEST SCENARIO 1: WITH DELIVERY CODE")
    
    # Step 1: Resident login
    print_step(1, "Resident Login")
    resident_token, resident_data = login(RESIDENT_EMAIL, RESIDENT_PASSWORD)
    if not resident_token:
        print_error("Cannot continue without resident login")
        return False
    
    # Step 2: Resident creates notification with delivery code
    print_step(2, "Resident Creates Notification WITH Delivery Code")
    delivery_code = "1234"
    notification_id = create_resident_notification(
        resident_token, 
        resident_data, 
        delivery_code=delivery_code
    )
    if not notification_id:
        print_error("Cannot continue without notification")
        return False
    
    # Step 3: Security login
    print_step(3, "Security Login")
    security_token, security_data = login(SECURITY_EMAIL, SECURITY_PASSWORD)
    if not security_token:
        print_error("Cannot continue without security login")
        return False
    
    # Step 4: Security creates package (simulating AI cargo registration)
    print_step(4, "Security Creates Package (AI Cargo Registration)")
    package_id, package_data = create_package_with_ai(
        security_token,
        resident_data,  # Use resident data, not security data
        resident_data.get('apartmentId')
    )
    if not package_id:
        print_error("Cannot continue without package")
        return False
    
    # Step 5: Verify delivery code is in package
    print_step(5, "Verify Delivery Code in Package")
    package_details = get_package_details(security_token, package_id)
    if package_details and package_details.get('deliveryCode') == delivery_code:
        print_success(f"✓ Delivery code matched: {delivery_code}")
    else:
        print_error("Delivery code not found or doesn't match")
        return False
    
    # Step 6: Security initiates delivery
    print_step(6, "Security Initiates Delivery")
    print_info("In mobile app, security should see this alert:")
    print_info("┌─────────────────────────────────────┐")
    print_info("│      🔐 Teslim Kodu                 │")
    print_info("│                                     │")
    print_info("│  Bu paketin teslim kodu:            │")
    print_info("│                                     │")
    print_info(f"│         {delivery_code}                        │")
    print_info("│                                     │")
    print_info("│  Lütfen bu kodu kuryeye söyleyin.   │")
    print_info("│                                     │")
    print_info("│  [İptal] [Kodu Söyledim, Teslim Et]│")
    print_info("└─────────────────────────────────────┘")
    
    success = initiate_delivery(security_token, package_id)
    
    if success:
        print_success("✓ SCENARIO 1 PASSED: Delivery code feature works!")
    else:
        print_error("✗ SCENARIO 1 FAILED")
    
    return success

def run_test_scenario_without_code():
    """Test Scenario 2: Resident creates notification WITHOUT delivery code"""
    print_section("TEST SCENARIO 2: WITHOUT DELIVERY CODE")
    
    # Step 1: Resident login
    print_step(1, "Resident Login")
    resident_token, resident_data = login(RESIDENT_EMAIL, RESIDENT_PASSWORD)
    if not resident_token:
        print_error("Cannot continue without resident login")
        return False
    
    # Step 2: Resident creates notification WITHOUT delivery code
    print_step(2, "Resident Creates Notification WITHOUT Delivery Code")
    notification_id = create_resident_notification(
        resident_token, 
        resident_data, 
        delivery_code=None
    )
    if not notification_id:
        print_error("Cannot continue without notification")
        return False
    
    # Step 3: Security login
    print_step(3, "Security Login")
    security_token, security_data = login(SECURITY_EMAIL, SECURITY_PASSWORD)
    if not security_token:
        print_error("Cannot continue without security login")
        return False
    
    # Step 4: Security creates package
    print_step(4, "Security Creates Package (AI Cargo Registration)")
    package_id, package_data = create_package_with_ai(
        security_token,
        resident_data,
        resident_data.get('apartmentId')
    )
    if not package_id:
        print_error("Cannot continue without package")
        return False
    
    # Step 5: Verify NO delivery code in package
    print_step(5, "Verify NO Delivery Code in Package")
    package_details = get_package_details(security_token, package_id)
    if package_details and not package_details.get('deliveryCode'):
        print_success("✓ No delivery code (as expected)")
    else:
        print_error("Unexpected delivery code found")
        return False
    
    # Step 6: Security initiates delivery
    print_step(6, "Security Initiates Delivery")
    print_info("In mobile app, security should NOT see delivery code alert")
    print_info("Package should be delivered directly without alert")
    
    success = initiate_delivery(security_token, package_id)
    
    if success:
        print_success("✓ SCENARIO 2 PASSED: No alert when no delivery code!")
    else:
        print_error("✗ SCENARIO 2 FAILED")
    
    return success

def main():
    """Main test runner"""
    print("\n")
    print("╔════════════════════════════════════════════════════════════╗")
    print("║     DELIVERY CODE FEATURE - INTEGRATION TEST              ║")
    print("╚════════════════════════════════════════════════════════════╝")
    
    print_info(f"Base URL: {BASE_URL}")
    print_info(f"Resident User: {RESIDENT_EMAIL}")
    print_info(f"Security User: {SECURITY_EMAIL}")
    
    # Run test scenarios
    scenario1_passed = run_test_scenario_with_code()
    scenario2_passed = run_test_scenario_without_code()
    
    # Final summary
    print_section("TEST SUMMARY")
    
    if scenario1_passed:
        print_success("✓ Scenario 1: WITH delivery code - PASSED")
    else:
        print_error("✗ Scenario 1: WITH delivery code - FAILED")
    
    if scenario2_passed:
        print_success("✓ Scenario 2: WITHOUT delivery code - PASSED")
    else:
        print_error("✗ Scenario 2: WITHOUT delivery code - FAILED")
    
    print("\n")
    if scenario1_passed and scenario2_passed:
        print("╔════════════════════════════════════════════════════════════╗")
        print("║              ✓ ALL TESTS PASSED! 🎉                       ║")
        print("╚════════════════════════════════════════════════════════════╝")
        print("\nDelivery code feature is working correctly!")
        print("\nNext steps:")
        print("1. Test in mobile app (Expo)")
        print("2. Verify alert shows delivery code")
        print("3. Test with different delivery codes")
    else:
        print("╔════════════════════════════════════════════════════════════╗")
        print("║              ✗ SOME TESTS FAILED                          ║")
        print("╚════════════════════════════════════════════════════════════╝")
        print("\nPlease check the errors above and fix them.")
    
    print("\n")

if __name__ == '__main__':
    main()
