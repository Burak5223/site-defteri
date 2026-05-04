import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { UserRole, Site } from '../types';
import type { Language } from '../config/i18n';
import { getTranslation } from '../config/i18n';
import { getBottomNavItems, navItems } from '../config/navigation';
import { MobileHeader } from '../components/MobileHeader';
import { MobileDrawer } from '../components/MobileDrawer';
import { SiteSelectorModal } from '../components/SiteSelectorModal';

// Import screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import DuesScreen from '../screens/dues/DuesScreen';
import PackagesScreen from '../screens/packages/PackagesScreen';
import MessagesScreen from '../screens/messages/MessagesScreen';
import AnnouncementsScreen from '../screens/announcements/AnnouncementsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { FinanceScreen } from '../screens/finance/FinanceScreen';
import { MaintenanceScreen } from '../screens/maintenance/MaintenanceScreen';
import { VotingScreen } from '../screens/voting/VotingScreen';
import { TasksScreen } from '../screens/tasks/TasksScreen';
import { TicketsScreen } from '../screens/tickets/TicketsScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';

const Tab = createBottomTabNavigator();

interface MainTabsProps {
  role: UserRole;
  lang?: Language;
}

export function MainTabs({ role, lang = 'tr' }: MainTabsProps) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [siteSelectorOpen, setSiteSelectorOpen] = React.useState(false);
  const [messageCount] = React.useState(3);
  
  // Mock current site and sites data
  const [currentSite, setCurrentSite] = React.useState<Site>({
    id: '1',
    name: 'Güneş Sitesi',
    city: 'İstanbul',
    totalApartments: 120,
  });
  
  const [sites] = React.useState<Site[]>([
    currentSite,
    { id: '2', name: 'Yıldız Sitesi', city: 'Ankara', totalApartments: 80 },
  ]);

  const t = (key: any) => getTranslation(lang, key);
  
  const bottomNavIds = getBottomNavItems(role);
  const bottomNavItems = bottomNavIds
    .map(id => navItems.find(item => item.id === id))
    .filter(Boolean);

  const getScreenComponent = (screenId: string) => {
    switch (screenId) {
      case 'home': return DashboardScreen;
      case 'dues': return DuesScreen;
      case 'packages': return PackagesScreen;
      case 'messages': return MessagesScreen;
      case 'announcements': return AnnouncementsScreen;
      case 'profile': return ProfileScreen;
      case 'finance': return FinanceScreen;
      case 'maintenance': return MaintenanceScreen;
      case 'voting': return VotingScreen;
      case 'tasks': return TasksScreen;
      case 'tickets': return TicketsScreen;
      case 'settings': return SettingsScreen;
      default: return DashboardScreen;
    }
  };

  return (
    <View style={styles.container}>
      <MobileHeader
        role={role}
        currentSite={currentSite}
        sites={sites}
        onSitePress={() => setSiteSelectorOpen(true)}
        onMenuPress={() => setDrawerOpen(true)}
        lang={lang}
      />
      
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#6366f1',
          tabBarInactiveTintColor: '#9ca3af',
          tabBarStyle: {
            borderTopWidth: 1,
            borderTopColor: '#e5e7eb',
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '500',
          },
        }}
      >
        {bottomNavItems.map((item) => {
          if (!item) return null;
          const Icon = item.icon;
          const showBadge = item.id === 'messages' && messageCount > 0;

          return (
            <Tab.Screen
              key={item.id}
              name={item.id}
              component={getScreenComponent(item.id)}
              options={{
                tabBarLabel: t(item.labelKey),
                tabBarIcon: ({ color, size }) => <Icon size={size} color={color} />,
                tabBarBadge: showBadge ? messageCount : undefined,
              }}
            />
          );
        })}
      </Tab.Navigator>

      <MobileDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        role={role}
        activeTab="home"
        onTabChange={(tab) => {
          // Handle tab change
          setDrawerOpen(false);
        }}
        messageCount={messageCount}
        lang={lang}
      />

      <SiteSelectorModal
        visible={siteSelectorOpen}
        onClose={() => setSiteSelectorOpen(false)}
        currentSite={currentSite}
        sites={sites}
        onSiteChange={setCurrentSite}
        lang={lang}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
