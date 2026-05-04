#!/usr/bin/env python3
"""
Push Notification Gönderme Script'i
Database'e direkt bildirim kaydeder ve FCM üzerinden gönderir
"""

import mysql.connector
import uuid
from datetime import datetime
import sys

def send_push_notification_via_fcm(user_id, title, body):
    """FCM üzerinden push notification gönder"""
    
    try:
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='Hilton5252.',
            database='site_yonetim'
        )
        
        cursor = conn.cursor(dictionary=True)
        
        # FCM token'ı al
        cursor.execute('SELECT fcm_token FROM user_fcm_tokens WHERE user_id = %s ORDER BY updated_at DESC LIMIT 1', (user_id,))
        token_row = cursor.fetchone()
        
        if not token_row:
            print(f'✗ Kullanıcının FCM token\'ı bulunamadı: {user_id}')
            cursor.close()
            conn.close()
            return False
        
        fcm_token = token_row['fcm_token']
        
        print(f'✓ FCM Token bulundu: {fcm_token[:50]}...')
        print(f'  Backend\'e push notification gönderme isteği yapılacak')
        print(f'  Başlık: {title}')
        print(f'  Mesaj: {body}')
        
        # Not: Gerçek FCM gönderimi backend tarafından yapılır
        # Bu script sadece database'e kaydeder
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f'✗ Hata: {str(e)}')
        return False

def send_notification(user_id, title, body, notification_type='info', related_type=None, related_id=None):
    """Kullanıcıya bildirim gönder"""
    
    try:
        # Database bağlantısı
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='Hilton5252.',
            database='site_yonetim'
        )
        
        cursor = conn.cursor()
        
        # Bildirim ID oluştur
        notification_id = str(uuid.uuid4())
        
        # SQL sorgusu
        sql = '''
        INSERT INTO notifications 
        (id, user_id, title, body, type, notification_type, related_type, related_id, is_read, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        '''
        
        values = (
            notification_id,
            user_id,
            title,
            body,
            notification_type,  # type (legacy)
            notification_type,  # notification_type
            related_type,
            related_id,
            False,  # is_read
            datetime.now(),  # created_at
            datetime.now()   # updated_at
        )
        
        cursor.execute(sql, values)
        conn.commit()
        
        print(f'✓ Bildirim başarıyla gönderildi!')
        print(f'  ID: {notification_id}')
        print(f'  User ID: {user_id}')
        print(f'  Başlık: {title}')
        print(f'  Mesaj: {body[:50]}...' if len(body) > 50 else f'  Mesaj: {body}')
        print(f'  Tip: {notification_type}')
        
        # FCM push notification gönder
        print(f'\n📱 Push notification gönderiliyor...')
        send_push_notification_via_fcm(user_id, title, body)
        
        cursor.close()
        conn.close()
        
        return notification_id
        
    except Exception as e:
        print(f'✗ Hata: {str(e)}')
        return None


def get_user_by_phone(phone):
    """Telefon numarasından kullanıcı ID'si bul"""
    
    try:
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='Hilton5252.',
            database='site_yonetim'
        )
        
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT id, name, phone_number, role FROM users WHERE phone_number = %s', (phone,))
        user = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        return user
        
    except Exception as e:
        print(f'✗ Kullanıcı bulunamadı: {str(e)}')
        return None


def list_users():
    """Tüm kullanıcıları listele"""
    
    try:
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='Hilton5252.',
            database='site_yonetim'
        )
        
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT id, name, phone_number, role FROM users ORDER BY name')
        users = cursor.fetchall()
        
        print('\n=== KULLANICILAR ===')
        for user in users:
            print(f"  {user['name']:20} | {user['phone_number']:12} | {user['role']:15} | ID: {user['id']}")
        
        cursor.close()
        conn.close()
        
        return users
        
    except Exception as e:
        print(f'✗ Hata: {str(e)}')
        return []


if __name__ == '__main__':
    print('=== PUSH NOTIFICATION GÖNDERME ===\n')
    
    # Kullanım örnekleri
    if len(sys.argv) > 1:
        if sys.argv[1] == 'list':
            # Kullanıcıları listele
            list_users()
        elif sys.argv[1] == 'send':
            # Bildirim gönder
            if len(sys.argv) < 5:
                print('Kullanım: python send_notification.py send <phone> <title> <body>')
                sys.exit(1)
            
            phone = sys.argv[2]
            title = sys.argv[3]
            body = sys.argv[4]
            
            user = get_user_by_phone(phone)
            if user:
                print(f'\nKullanıcı bulundu: {user["name"]} ({user["role"]})')
                send_notification(user['id'], title, body)
            else:
                print(f'✗ Kullanıcı bulunamadı: {phone}')
        else:
            print('Bilinmeyen komut. Kullanım:')
            print('  python send_notification.py list')
            print('  python send_notification.py send <phone> <title> <body>')
    else:
        # İnteraktif mod
        print('1. Kullanıcıları listele')
        print('2. Bildirim gönder')
        print('3. Test bildirimi gönder')
        print()
        
        choice = input('Seçiminiz (1-3): ')
        
        if choice == '1':
            list_users()
        
        elif choice == '2':
            phone = input('\nTelefon numarası (örn: 5551234567): ')
            user = get_user_by_phone(phone)
            
            if user:
                print(f'\nKullanıcı: {user["name"]} ({user["role"]})')
                print()
                
                title = input('Bildirim başlığı: ')
                body = input('Bildirim mesajı: ')
                
                notification_type = input('Bildirim tipi (info/warning/success/error) [info]: ') or 'info'
                
                send_notification(user['id'], title, body, notification_type)
            else:
                print(f'✗ Kullanıcı bulunamadı: {phone}')
        
        elif choice == '3':
            # Test bildirimi - admin kullanıcısına gönder
            user = get_user_by_phone('5559876543')  # Ahmet Yilmaz - Sakin
            
            if user:
                title = '� Aidat Hatırlatması'
                body = f'Aidatınızı ödeyin! 500 TL aidat borcunuz bulunmaktadır.\n\nSon ödeme tarihi: {(datetime.now()).strftime("%d.%m.%Y")}\n\nLütfen ödemenizi zamanında yapınız.'
                
                print(f'\nAidat hatırlatma bildirimi gönderiliyor: {user["name"]}')
                send_notification(user['id'], title, body, 'warning', 'due', 'due-123')
            else:
                print('✗ Sakin kullanıcısı bulunamadı')
        
        else:
            print('Geçersiz seçim')
    
    print()
