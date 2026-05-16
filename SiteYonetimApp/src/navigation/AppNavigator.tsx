import React from 'react';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import SuperAdminNavigator from './SuperAdminNavigator';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, isLoading, user, hasRole, isImpersonating } = useAuth();
  const { colors, isDarkMode } = useTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.backgroundSecondary }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Navigation'ı reset etmek için key kullan - kullanıcı değiştiğinde navigation sıfırlanır
  const navigationKey = isAuthenticated ? `authenticated-${user?.userId || 'default'}-${isImpersonating ? 'impersonated' : 'normal'}` : 'unauthenticated';

  // Navigator seçimi
  const getMainNavigator = () => {
    console.log('AppNavigator - User roles:', user?.roles);
    console.log('AppNavigator - Is impersonating:', isImpersonating);
    
    // Eğer impersonation yapıyorsak, her zaman MainNavigator kullan
    if (isImpersonating) {
      console.log('Using MainNavigator for impersonated user');
      return <MainNavigator />;
    }
    
    // Super Admin ve impersonation yapmıyorsa SuperAdminNavigator kullan
    if (hasRole('ROLE_SUPER_ADMIN') && !hasRole('ROLE_ADMIN')) {
      console.log('Using SuperAdminNavigator for Super Admin');
      return <SuperAdminNavigator />;
    }
    
    // Diğer tüm durumlar için MainNavigator
    console.log('Using MainNavigator for regular user');
    return <MainNavigator />;
  };

  const navigationTheme = {
    ...(isDarkMode ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDarkMode ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.backgroundSecondary,
      card: colors.background,
      text: colors.textPrimary,
      border: colors.border,
      notification: colors.error,
    },
  };

  return (
    <NavigationContainer key={navigationKey} theme={navigationTheme}>
      {isAuthenticated ? getMainNavigator() : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default AppNavigator;
