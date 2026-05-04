import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Backend URL - Bilgisayarının IP adresi
const BACKEND_URL = 'http://192.168.1.179:8080';

// FCM İzin İste
export async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('✅ Bildirim izni verildi');
    await getFCMToken();
  } else {
    console.log('❌ Bildirim izni reddedildi');
  }
}

// FCM Token Al ve Backend'e Kaydet
export async function getFCMToken() {
  try {
    const oldToken = await AsyncStorage.getItem('fcm_token');
    const token = await messaging().getToken();
    
    if (token && token !== oldToken) {
      console.log('🔥 FCM Token:', token);
      await AsyncStorage.setItem('fcm_token', token);
      await saveFCMTokenToBackend(token);
    }
    
    return token;
  } catch (error) {
    console.error('❌ FCM Token alınamadı:', error);
    return null;
  }
}

// Backend'e Token Kaydet
async function saveFCMTokenToBackend(token: string) {
  try {
    console.log('🔄 Backend\'e token gönderiliyor...');
    console.log('📍 URL:', `${BACKEND_URL}/api/users/fcm-token`);
    console.log('🔑 Token:', token.substring(0, 50) + '...');
    
    const response = await fetch(`${BACKEND_URL}/api/users/fcm-token`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({token, deviceType: 'ANDROID'}),
    });

    console.log('📊 Response Status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend hatası:', errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Token backend\'e kaydedildi:', data);
  } catch (error) {
    console.error('❌ Token backend\'e gönderilemedi:', error);
    console.error('❌ Hata detayı:', JSON.stringify(error));
  }
}

// Bildirim Dinle (Foreground)
export function setupNotificationListener() {
  messaging().onMessage(async remoteMessage => {
    console.log('🔔 Yeni bildirim:', remoteMessage);
    if (remoteMessage.notification) {
      console.log('Başlık:', remoteMessage.notification.title);
      console.log('İçerik:', remoteMessage.notification.body);
    }
  });
}

// Background Bildirim Handler
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('🔔 Background bildirim:', remoteMessage);
});
