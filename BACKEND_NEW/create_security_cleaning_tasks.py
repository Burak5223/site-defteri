import mysql.connector
from datetime import datetime, timedelta
import uuid

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)
cursor = conn.cursor()

# Get user IDs
cursor.execute("SELECT id FROM users WHERE email = 'security@site.com'")
security_user = cursor.fetchone()
security_id = security_user[0] if security_user else None

cursor.execute("SELECT id FROM users WHERE email = 'cleaning@site.com'")
cleaning_user = cursor.fetchone()
cleaning_id = cleaning_user[0] if cleaning_user else None

if not security_id or not cleaning_id:
    print("ERROR: Security or Cleaning user not found!")
    conn.close()
    exit(1)

print(f"Security User ID: {security_id}")
print(f"Cleaning User ID: {cleaning_id}")

# Delete existing tasks for these users
cursor.execute("DELETE FROM tasks WHERE assigned_to IN (%s, %s)", (security_id, cleaning_id))
print(f"Deleted {cursor.rowcount} existing tasks")

# Current time
now = datetime.now()
today = now.date()
yesterday = today - timedelta(days=1)
tomorrow = today + timedelta(days=1)

# Security Tasks
security_tasks = [
    # Bugün tamamlanmalı - bekliyor
    {
        'title': 'Giriş Kapısı Kontrolü',
        'description': 'Ana giriş kapısının güvenlik kontrolü yapılacak',
        'task_type': 'guvenlik',
        'status': 'bekliyor',
        'due_date': today,
        'assigned_to': security_id
    },
    # Bugün tamamlanmalı - devam ediyor
    {
        'title': 'Kamera Sistemi Kontrolü',
        'description': 'Tüm güvenlik kameralarının çalışır durumda olduğu kontrol edilecek',
        'task_type': 'guvenlik',
        'status': 'devam_ediyor',
        'due_date': today,
        'assigned_to': security_id
    },
    # Bugün tamamlandı
    {
        'title': 'Gece Devriye',
        'description': 'Gece devriye turu tamamlandı',
        'task_type': 'guvenlik',
        'status': 'tamamlandi',
        'due_date': today,
        'assigned_to': security_id,
        'completed_at': now
    },
    # Yarın teslim edilecek
    {
        'title': 'Otopark Güvenlik Raporu',
        'description': 'Otopark alanının güvenlik raporu hazırlanacak',
        'task_type': 'guvenlik',
        'status': 'bekliyor',
        'due_date': tomorrow,
        'assigned_to': security_id
    },
    # Gecikmiş
    {
        'title': 'Acil Durum Planı Güncelleme',
        'description': 'Acil durum planının güncellenmesi gerekiyor',
        'task_type': 'guvenlik',
        'status': 'bekliyor',
        'due_date': yesterday,
        'assigned_to': security_id
    }
]

# Cleaning Tasks
cleaning_tasks = [
    # Bugün tamamlanmalı - bekliyor
    {
        'title': 'Ortak Alan Temizliği',
        'description': 'Lobiler ve koridorların temizliği yapılacak',
        'task_type': 'temizlik',
        'status': 'bekliyor',
        'due_date': today,
        'assigned_to': cleaning_id
    },
    # Bugün tamamlanmalı - devam ediyor
    {
        'title': 'Asansör Temizliği',
        'description': 'Tüm asansörlerin iç temizliği yapılıyor',
        'task_type': 'temizlik',
        'status': 'devam_ediyor',
        'due_date': today,
        'assigned_to': cleaning_id
    },
    # Bugün tamamlandı
    {
        'title': 'Merdiven Temizliği',
        'description': 'Tüm kat merdivenlerinin temizliği tamamlandı',
        'task_type': 'temizlik',
        'status': 'tamamlandi',
        'due_date': today,
        'assigned_to': cleaning_id,
        'completed_at': now
    },
    # Bugün tamamlandı - 2
    {
        'title': 'Çöp Toplama',
        'description': 'Ortak alanlardan çöp toplama işi tamamlandı',
        'task_type': 'temizlik',
        'status': 'tamamlandi',
        'due_date': today,
        'assigned_to': cleaning_id,
        'completed_at': now - timedelta(hours=2)
    },
    # Yarın teslim edilecek
    {
        'title': 'Bahçe Temizliği',
        'description': 'Site bahçesinin genel temizliği yapılacak',
        'task_type': 'temizlik',
        'status': 'bekliyor',
        'due_date': tomorrow,
        'assigned_to': cleaning_id
    },
    # Yarın teslim edilecek - 2
    {
        'title': 'Cam Temizliği',
        'description': 'Ortak alan camlarının temizliği yapılacak',
        'task_type': 'temizlik',
        'status': 'bekliyor',
        'due_date': tomorrow,
        'assigned_to': cleaning_id
    },
    # Gecikmiş
    {
        'title': 'Yer Cilalama',
        'description': 'Lobi zemininin cilası yapılması gerekiyor',
        'task_type': 'temizlik',
        'status': 'bekliyor',
        'due_date': yesterday,
        'assigned_to': cleaning_id
    }
]

# Insert tasks
all_tasks = security_tasks + cleaning_tasks
created_count = 0

for task in all_tasks:
    task_id = str(uuid.uuid4())
    
    sql = """
        INSERT INTO tasks (
            id, site_id, title, description, task_type, status,
            due_date, assigned_to, created_by, created_at, updated_at, completed_at, is_deleted
        ) VALUES (
            %s, '1', %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 0
        )
    """
    
    values = (
        task_id,
        task['title'],
        task['description'],
        task['task_type'],
        task['status'],
        task['due_date'],
        task['assigned_to'],
        task['assigned_to'],  # created_by
        now,  # created_at
        now,  # updated_at
        task.get('completed_at')  # completed_at (None if not completed)
    )
    
    cursor.execute(sql, values)
    created_count += 1
    print(f"Created: {task['title']} - {task['status']} (Due: {task['due_date']})")

conn.commit()

print(f"\n✅ Created {created_count} tasks")
print(f"   - Security tasks: {len(security_tasks)}")
print(f"   - Cleaning tasks: {len(cleaning_tasks)}")

# Verify
cursor.execute("""
    SELECT 
        u.email,
        COUNT(*) as total,
        SUM(CASE WHEN t.status = 'tamamlandi' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN t.status = 'devam_ediyor' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN t.status = 'beklemede' THEN 1 ELSE 0 END) as pending
    FROM tasks t
    JOIN users u ON t.assigned_to = u.id
    WHERE u.email IN ('security@site.com', 'cleaning@site.com')
    GROUP BY u.email
""")

print("\n=== TASK SUMMARY ===")
for row in cursor.fetchall():
    print(f"{row[0]}:")
    print(f"  Total: {row[1]}")
    print(f"  Completed: {row[2]}")
    print(f"  In Progress: {row[3]}")
    print(f"  Pending: {row[4]}")

conn.close()
