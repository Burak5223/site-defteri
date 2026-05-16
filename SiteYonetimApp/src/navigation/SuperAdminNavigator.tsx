import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text } from 'react-native';
import { Home, MessageSquare, UserCircle } from 'lucide-react-native';
import SuperAdminScreen from '../screens/superadmin/SuperAdminScreen';
import SuperAdminMessages from '../screens/superadmin/SuperAdminMessages';
import SuperAdminProfile from '../screens/superadmin/SuperAdminProfile';
import SuperAdminSitesScreen from '../screens/superadmin/SuperAdminSitesScreen';
import SuperAdminResidentsScreen from '../screens/superadmin/SuperAdminResidentsScreen';
import SuperAdminFinanceScreen from '../screens/superadmin/SuperAdminFinanceScreen';
import SuperAdminPerformanceScreen from '../screens/superadmin/SuperAdminPerformanceScreen';
import SuperAdminChatScreen from '../screens/superadmin/SuperAdminChatScreen';
import SuperAdminSystemChatScreen from '../screens/superadmin/SuperAdminSystemChatScreen';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack Navigator for Super Admin Home with sub-screens
const SuperAdminHomeStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SuperAdminHome" component={SuperAdminScreen} />
      <Stack.Screen name="SuperAdminSites" component={SuperAdminSitesScreen} />
      <Stack.Screen name="SuperAdminResidents" component={SuperAdminResidentsScreen} />
      <Stack.Screen name="SuperAdminFinance" component={SuperAdminFinanceScreen} />
      <Stack.Screen name="SuperAdminPerformance" component={SuperAdminPerformanceScreen} />
    </Stack.Navigator>
  );
};

// Stack Navigator for Super Admin Messages with sub-screens
const SuperAdminMessagesStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SuperAdminMessagesHome" component={SuperAdminMessages} />
      <Stack.Screen name="SuperAdminChat" component={SuperAdminChatScreen} />
      <Stack.Screen name="SuperAdminSystemChat" component={SuperAdminSystemChatScreen} />
    </Stack.Navigator>
  );
};

const SuperAdminNavigator = () => {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="SuperAdminHomeTab"
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          height: 90,
          paddingBottom: 30,
          paddingTop: 10,
          borderTopColor: colors.border,
          backgroundColor: colors.background,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 4,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="SuperAdminHomeTab" 
        component={SuperAdminHomeStack}
        options={{
          tabBarLabel: 'Ana Sayfa',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tab.Screen 
        name="SuperAdminMessagesTab" 
        component={SuperAdminMessagesStack}
        options={{
          tabBarLabel: 'Mesajlar',
          tabBarIcon: ({ color }) => (
            <View>
              <MessageSquare size={24} color={color} />
              <View style={{ 
                position: 'absolute', 
                right: -8, 
                top: -4, 
                backgroundColor: colors.success, 
                borderRadius: 10, 
                minWidth: 18, 
                height: 18, 
                justifyContent: 'center', 
                alignItems: 'center',
                paddingHorizontal: 4,
              }}>
                <Text style={{ color: colors.white, fontSize: 10, fontWeight: 'bold' }}>
                  2
                </Text>
              </View>
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="SuperAdminProfileTab" 
        component={SuperAdminProfile}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color }) => <UserCircle size={24} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

export default SuperAdminNavigator;
