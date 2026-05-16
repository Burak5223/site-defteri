import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/context/AuthContext';
import { I18nProvider } from './src/context/I18nContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

const AppContent = () => {
  const { isDarkMode, ready } = useTheme();
  const AppNavigator = ready ? require('./src/navigation/AppNavigator').default : null;

  if (!ready || !AppNavigator) {
    return null;
  }

  return (
    <>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <NotificationProvider>
              <AppContent />
            </NotificationProvider>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
