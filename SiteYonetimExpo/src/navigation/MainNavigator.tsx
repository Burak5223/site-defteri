import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import AnnouncementsScreen from '../screens/announcements/AnnouncementsScreen';
import AnnouncementDetailScreen from '../screens/announcements/AnnouncementDetailScreen';
import DuesScreen from '../screens/dues/DuesScreen';
import PackagesScreen from '../screens/packages/PackagesScreen';
import MessagesScreen from '../screens/messages/MessagesScreen';
import MessageDetailScreen from '../screens/messages/MessageDetailScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const DashboardStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="DashboardMain" 
      component={DashboardScreen}
      options={{ title: 'Ana Sayfa' }}
    />
  </Stack.Navigator>
);

const AnnouncementsStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="AnnouncementsList" 
      component={AnnouncementsScreen}
      options={{ title: 'Duyurular' }}
    />
    <Stack.Screen 
      name="AnnouncementDetail" 
      component={AnnouncementDetailScreen}
      options={{ title: 'Duyuru Detayı' }}
    />
  </Stack.Navigator>
);

const DuesStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="DuesList" 
      component={DuesScreen}
      options={{ title: 'Aidatlar' }}
    />
  </Stack.Navigator>
);

const PackagesStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="PackagesList" 
      component={PackagesScreen}
      options={{ title: 'Paketler' }}
    />
  </Stack.Navigator>
);

const MessagesStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="MessagesList" 
      component={MessagesScreen}
      options={{ title: 'Mesajlar' }}
    />
    <Stack.Screen 
      name="MessageDetail" 
      component={MessageDetailScreen}
      options={{ title: 'Mesaj Detayı' }}
    />
  </Stack.Navigator>
);

const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#64748b',
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStack}
        options={{
          tabBarLabel: 'Ana Sayfa',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Announcements"
        component={AnnouncementsStack}
        options={{
          tabBarLabel: 'Duyurular',
          tabBarIcon: ({ color, size }) => (
            <Icon name="bullhorn" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Dues"
        component={DuesStack}
        options={{
          tabBarLabel: 'Aidatlar',
          tabBarIcon: ({ color, size }) => (
            <Icon name="cash" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Packages"
        component={PackagesStack}
        options={{
          tabBarLabel: 'Paketler',
          tabBarIcon: ({ color, size }) => (
            <Icon name="package-variant" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesStack}
        options={{
          tabBarLabel: 'Mesajlar',
          tabBarIcon: ({ color, size }) => (
            <Icon name="message" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
