import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { lightTheme } from './src/theme';
import {
  requestUserPermission,
  getFCMToken,
  setupNotificationListener,
} from './src/config/firebase';

function App(): React.JSX.Element {
  useEffect(() => {
    requestUserPermission();
    setupNotificationListener();
    getFCMToken();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={lightTheme}>
        <AuthProvider>
          <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
          <AppNavigator />
        </AuthProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}

export default App;
