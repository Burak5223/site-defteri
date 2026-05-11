#!/usr/bin/env python3
"""
Debug Packages Dashboard Issue
"""

import requests
import json

def debug_packages_dashboard():
    base_url = "http://192.168.70.211:8080"
    
    print("🔍 Debugging Packages Dashboard Issue...")
    
    # Login as admin to see all packages
    print("\n1️⃣ Login as admin to see all packages...")
    login_data = {
        "email": "admin@site.com",
        "password": "admin123"
    }
    
    try:
        login_response = requests.post(f"{base_url}/api/auth/login", json=login_data)
        print(f"Admin Login Status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            login_result = login_response.json()
            token = login_result.get('accessToken')
            
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            # Get all packages as admin
            print(f"\n2️⃣ Getting all packages as admin...")
            packages_response = requests.get(f"{base_url}/api/packages", headers=headers)
            print(f"All packages Status: {packages_response.status_code}")
            
            if packages_response.status_code == 200:
                packages_data = packages_response.json()
                print(f"✅ Total packages in system: {len(packages_data)}")
                
                # Analyze packages by apartment
                sakin_apartment_id = "e79b4676-6bf3-41f0-a490-c46795a6b313"
                
                print(f"\n📦 Package Analysis:")
                print(f"Looking for packages with apartment ID: {sakin_apartment_id}")
                
                # Group by apartment ID
                apartment_packages = {}
                status_counts = {}
                
                for package in packages_data:
                    apt_id = package.get('apartmentId', 'unknown')
                    status = package.get('status', 'unknown')
                    
                    if apt_id not in apartment_packages:
                        apartment_packages[apt_id] = []
                    apartment_packages[apt_id].append(package)
                    
                    if status not in status_counts:
                        status_counts[status] = 0
                    status_counts[status] += 1
                
                print(f"\nPackage Status Breakdown:")
                for status, count in status_counts.items():
                    print(f"  {status}: {count}")
                
                print(f"\nPackages by Apartment:")
                for apt_id, pkgs in apartment_packages.items():
                    print(f"  {apt_id}: {len(pkgs)} packages")
                    if apt_id == sakin_apartment_id:
                        print(f"    ⭐ This is sakin's apartment!")
                        for pkg in pkgs:
                            print(f"      - ID: {pkg.get('id')}")
                            print(f"        Status: {pkg.get('status')}")
                            print(f"        Recipient: {pkg.get('recipientName')}")
                            print(f"        Created: {pkg.get('createdAt')}")
                
                # Check waiting packages for sakin's apartment
                sakin_packages = apartment_packages.get(sakin_apartment_id, [])
                waiting_statuses = ['beklemede', 'waiting', 'teslim_bekliyor', 'waiting_confirmation']
                waiting_packages = [p for p in sakin_packages if p.get('status') in waiting_statuses]
                
                print(f"\n🎯 Sakin's Apartment Analysis:")
                print(f"Total packages: {len(sakin_packages)}")
                print(f"Waiting packages: {len(waiting_packages)}")
                
                if waiting_packages:
                    print("Waiting packages details:")
                    for pkg in waiting_packages:
                        print(f"  - ID: {pkg.get('id')}")
                        print(f"    Status: {pkg.get('status')}")
                        print(f"    Recipient: {pkg.get('recipientName')}")
                
            else:
                print(f"❌ All packages Error: {packages_response.status_code}")
                print(f"Response: {packages_response.text}")
        
        # Now test sakin user
        print(f"\n3️⃣ Testing sakin user dashboard...")
        sakin_login_data = {
            "email": "sakin@site.com",
            "password": "sakin123"
        }
        
        sakin_login_response = requests.post(f"{base_url}/api/auth/login", json=sakin_login_data)
        if sakin_login_response.status_code == 200:
            sakin_login_result = sakin_login_response.json()
            sakin_token = sakin_login_result.get('accessToken')
            
            sakin_headers = {
                "Authorization": f"Bearer {sakin_token}",
                "Content-Type": "application/json"
            }
            
            # Test dashboard
            dashboard_response = requests.get(f"{base_url}/api/users/me/dashboard", headers=sakin_headers)
            if dashboard_response.status_code == 200:
                dashboard_data = dashboard_response.json()
                print(f"Dashboard waiting packages: {dashboard_data.get('waitingPackages', 0)}")
            
            # Test packages by apartment
            sakin_apartment_id = "e79b4676-6bf3-41f0-a490-c46795a6b313"
            apt_packages_response = requests.get(f"{base_url}/api/apartments/{sakin_apartment_id}/packages", headers=sakin_headers)
            if apt_packages_response.status_code == 200:
                apt_packages_data = apt_packages_response.json()
                print(f"Apartment packages API: {len(apt_packages_data)} packages")
            else:
                print(f"Apartment packages API error: {apt_packages_response.status_code}")
                
    except requests.exceptions.ConnectionError as e:
        print(f"❌ Connection Error: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    debug_packages_dashboard()