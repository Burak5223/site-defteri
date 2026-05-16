import requests

BASE_URL = "http://localhost:8080/api"

# Test users
users = [
    {"email": "security@site.com", "password": "security123", "role": "SECURITY"},
    {"email": "cleaning@site.com", "password": "cleaning123", "role": "CLEANING"}
]

print("=" * 80)
print("TESTING SECURITY & CLEANING TASKS")
print("=" * 80)

for user in users:
    try:
        # Login
        response = requests.post(f"{BASE_URL}/auth/login", json={
            "email": user["email"],
            "password": user["password"]
        })
        
        if response.status_code != 200:
            print(f"\n{user['role']} - Login FAILED")
            continue
            
        data = response.json()
        token = data.get("accessToken") or data.get("token")
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get tasks
        tasks_response = requests.get(f"{BASE_URL}/sites/1/tasks", headers=headers)
        
        print(f"\n{user['role']} ({user['email']}):")
        print(f"  API Status: {tasks_response.status_code}")
        
        if tasks_response.status_code == 200:
            tasks = tasks_response.json()
            print(f"  Total Tasks: {len(tasks)}")
            
            # Count by status
            completed = sum(1 for t in tasks if t.get('status') == 'tamamlandi')
            in_progress = sum(1 for t in tasks if t.get('status') == 'devam_ediyor')
            pending = sum(1 for t in tasks if t.get('status') == 'bekliyor')
            
            print(f"  Completed: {completed}")
            print(f"  In Progress: {in_progress}")
            print(f"  Pending: {pending}")
            
            # Show tasks by due date
            from datetime import datetime, date
            today = date.today()
            
            today_tasks = [t for t in tasks if t.get('dueDate') == str(today)]
            overdue_tasks = [t for t in tasks if t.get('dueDate') and t.get('dueDate') < str(today) and t.get('status') != 'tamamlandi']
            
            print(f"\n  Tasks due TODAY ({today}):")
            for task in today_tasks:
                print(f"    - {task.get('title')}: {task.get('status')}")
            
            if overdue_tasks:
                print(f"\n  OVERDUE Tasks:")
                for task in overdue_tasks:
                    print(f"    - {task.get('title')}: {task.get('dueDate')}")
        else:
            print(f"  ERROR: {tasks_response.text}")
            
    except Exception as e:
        print(f"\n{user['role']} - ERROR: {str(e)}")

print("\n" + "=" * 80)
print("TEST COMPLETE")
print("=" * 80)
