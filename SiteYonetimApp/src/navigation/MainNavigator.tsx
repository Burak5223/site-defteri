import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { TouchableOpacity, View, Text, ScrollView } from 'react-native';
import {
  Home,
  Wallet,
  Wrench,
  MessageSquare,
  Users,
  Building,
  ClipboardList,
  Bell,
  Box,
  MoreHorizontal,
  LogOut,
  UserCircle,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { useNotifications } from '../context/NotificationContext';
import { SecurityPackages } from '../screens/packages/SecurityPackages';
import { AICargoRegistration } from '../screens/packages/AICargoRegistration';
import { SecurityTasks } from '../screens/tasks/SecurityTasks';
import SecurityTickets from '../screens/tickets/SecurityTickets';
import SecurityMaintenance from '../screens/maintenance/SecurityMaintenance';
import { CleaningTasks } from '../screens/tasks/CleaningTasks';
import CleaningTickets from '../screens/tickets/CleaningTickets';
import CleaningMaintenance from '../screens/maintenance/CleaningMaintenance';
import { QRScannerScreen } from '../screens/packages/QRScannerScreen';
import SuperAdminScreen from '../screens/superadmin/SuperAdminScreen';
import SuperAdminQuickActions from '../screens/superadmin/SuperAdminQuickActions';
import SuperAdminMessages from '../screens/superadmin/SuperAdminMessages';
import SuperAdminProfile from '../screens/superadmin/SuperAdminProfile';

// Screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import AdminDashboard from '../screens/dashboard/AdminDashboard';
import ResidentDashboard from '../screens/dashboard/ResidentDashboard';
import { SecurityDashboard } from '../screens/dashboard/SecurityDashboard';
import { CleaningDashboard } from '../screens/dashboard/CleaningDashboard';
import FinanceScreen from '../screens/finance/FinanceScreen';
import AdminFinance from '../screens/finance/AdminFinance';
import ResidentFinance from '../screens/finance/ResidentFinance';
import FinancialAnalyticsScreen from '../screens/finance/FinancialAnalyticsScreen';
import MaintenanceManagementScreen from '../screens/maintenance/MaintenanceManagementScreen';
import TasksScreen from '../screens/tasks/TasksScreen';
import TicketsScreen from '../screens/tickets/TicketsScreen';
import ResidentTickets from '../screens/tickets/ResidentTickets';
import VotingScreen from '../screens/voting/VotingScreen';
import AdminVoting from '../screens/voting/AdminVoting';
import ResidentVoting from '../screens/voting/ResidentVoting';
import ResidentsScreen from '../screens/residents/ResidentsScreen';
import AdminResidents from '../screens/residents/AdminResidents';
import SitesScreen from '../screens/sites/SitesScreen';
import AdminSites from '../screens/sites/AdminSites';
import VisitorsScreen from '../screens/visitors/VisitorsScreen';
import ResidentVisitorRequests from '../screens/visitors/ResidentVisitorRequests';
import SecurityVisitorRequests from '../screens/visitors/SecurityVisitorRequests';
import ProfileScreen from '../screens/profile/ProfileScreen';
import ResidentProfile from '../screens/profile/ResidentProfile';
import SettingsScreen from '../screens/settings/SettingsScreen';
import AdminSettings from '../screens/settings/AdminSettings';
import ResidentSettings from '../screens/settings/ResidentSettings';
import SiteSettingsScreen from '../screens/settings/SiteSettingsScreen';
import DuesScreen from '../screens/dues/DuesScreen';
import AdminDues from '../screens/dues/AdminDues';
import ResidentDues from '../screens/dues/ResidentDues';
import DueAssignmentScreen from '../screens/dues/DueAssignmentScreen';
import MonthDuesDetail from '../screens/dues/MonthDuesDetail';
// import StaffShiftsScreen from '../screens/staff/StaffShiftsScreen'; // Vardiyalar ekranı devre dışı
import MessagesScreen from '../screens/messages/MessagesScreen';
import AdminPackages from '../screens/packages/AdminPackages';
import ResidentPackages from '../screens/packages/ResidentPackages';
import AdminAnnouncements from '../screens/announcements/AdminAnnouncements';
import ResidentAnnouncements from '../screens/announcements/ResidentAnnouncements';
import ApartmentsScreen from '../screens/apartments/ApartmentsScreen';


const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack for Dashboard to include sub-screens
const DashboardStack = () => {
  const { t } = useI18n();
  
  return (
    <Stack.Navigator 
      initialRouteName="DashboardMain"
      screenOptions={{ 
          headerShown: false,
      }}
    >
      <Stack.Screen 
        name="DashboardMain" 
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="AdminDashboard" component={AdminDashboard} options={{ headerShown: true, title: t('nav.adminPanel') }} />
      <Stack.Screen name="ResidentDashboard" component={ResidentDashboard} options={{ headerShown: true, title: t('nav.home') }} />
      <Stack.Screen name="SecurityDashboard" component={SecurityDashboard} options={{ headerShown: true, title: t('nav.securityPanel') }} />
      <Stack.Screen name="CleaningDashboard" component={CleaningDashboard} options={{ headerShown: true, title: 'Temizlik Paneli' }} />
      <Stack.Screen name="Finance" component={FinanceScreen} options={{ headerShown: true, title: t('nav.finance') }} />
      <Stack.Screen name="AdminFinance" component={AdminFinance} options={{ headerShown: true, title: t('nav.financeManagement') }} />
      <Stack.Screen name="ResidentFinance" component={ResidentFinance} options={{ headerShown: true, title: t('nav.finance') }} />
      <Stack.Screen name="FinancialAnalytics" component={FinancialAnalyticsScreen} options={{ headerShown: true, title: t('nav.financialAnalytics') }} />
      <Stack.Screen name="Maintenance" component={MaintenanceManagementScreen} options={{ headerShown: true, title: t('nav.maintenanceManagement') }} />
      <Stack.Screen name="Tasks" component={TasksScreen} options={{ headerShown: true, title: t('nav.tasks') }} />
      <Stack.Screen name="SecurityTasks" component={SecurityTasks} options={{ headerShown: false }} />
      <Stack.Screen name="CleaningTasks" component={CleaningTasks} options={{ headerShown: false }} />
      <Stack.Screen name="Tickets" component={TicketsScreen} options={{ headerShown: true, title: t('nav.supportTickets') }} />
      <Stack.Screen name="ResidentTickets" component={ResidentTickets} options={{ headerShown: true, title: t('nav.ticketReports') }} />
      <Stack.Screen name="SecurityTickets" component={SecurityTickets} options={{ headerShown: true, title: t('nav.ticketReports') }} />
      <Stack.Screen name="CleaningTickets" component={CleaningTickets} options={{ headerShown: true, title: t('nav.ticketReports') }} />
      <Stack.Screen name="SecurityMaintenance" component={SecurityMaintenance} options={{ headerShown: true, title: t('nav.maintenanceManagement') }} />
      <Stack.Screen name="CleaningMaintenance" component={CleaningMaintenance} options={{ headerShown: true, title: t('nav.maintenanceManagement') }} />
      <Stack.Screen name="Voting" component={VotingScreen} options={{ headerShown: true, title: t('nav.voting') }} />
      <Stack.Screen name="AdminVoting" component={AdminVoting} options={{ headerShown: true, title: t('nav.eVoting') }} />
      <Stack.Screen name="ResidentVoting" component={ResidentVoting} options={{ headerShown: true, title: t('nav.eVoting') }} />
      <Stack.Screen name="Residents" component={AdminResidents} options={{ headerShown: true, title: t('nav.residents') }} />
      <Stack.Screen name="AdminResidents" component={AdminResidents} options={{ headerShown: true, title: t('nav.residents') }} />
      <Stack.Screen name="Sites" component={SitesScreen} options={{ headerShown: true, title: t('nav.sites') }} />
      <Stack.Screen name="AdminSites" component={AdminSites} options={{ headerShown: true, title: t('nav.sites') }} />
      <Stack.Screen name="Visitors" component={VisitorsScreen} options={{ headerShown: true, title: t('nav.visitors') }} />
      <Stack.Screen name="ResidentVisitorRequests" component={ResidentVisitorRequests} options={{ headerShown: true, title: 'Ziyaretçi Taleplerim' }} />
      <Stack.Screen name="SecurityVisitorRequests" component={SecurityVisitorRequests} options={{ headerShown: true, title: 'Ziyaretçi Talepleri' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: true, title: t('nav.profile') }} />
      <Stack.Screen name="ResidentProfile" component={ResidentProfile} options={{ headerShown: true, title: t('nav.profile') }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: true, title: t('nav.settings') }} />
      <Stack.Screen name="AdminSettings" component={AdminSettings} options={{ headerShown: true, title: t('nav.settings') }} />
      <Stack.Screen name="ResidentSettings" component={ResidentSettings} options={{ headerShown: true, title: t('nav.settings') }} />
      <Stack.Screen name="SiteSettings" component={SiteSettingsScreen} options={{ headerShown: true, title: t('nav.siteSettings') }} />
      <Stack.Screen name="Announcements" component={AdminAnnouncements} options={{ headerShown: true, title: t('nav.announcements') }} />
      <Stack.Screen name="ResidentAnnouncements" component={ResidentAnnouncements} options={{ headerShown: true, title: t('nav.announcements') }} />
      <Stack.Screen name="Dues" component={DuesScreen} options={{ headerShown: true, title: t('nav.dues') }} />
      <Stack.Screen name="AdminDues" component={AdminDues} options={{ headerShown: true, title: t('nav.bulkDueAssignment') }} />
      <Stack.Screen name="ResidentDues" component={ResidentDues} options={{ headerShown: true, title: t('nav.myDues') }} />
      <Stack.Screen name="DueAssignment" component={DueAssignmentScreen} options={{ headerShown: true, title: t('nav.assignDue') }} />
      <Stack.Screen name="MonthDuesDetail" component={MonthDuesDetail} options={{ headerShown: true, title: t('nav.dueDetail') }} />
      {/* <Stack.Screen name="StaffShifts" component={StaffShiftsScreen} options={{ headerShown: true, title: t('nav.shifts') }} /> */}
      <Stack.Screen name="Packages" component={AdminPackages} options={{ headerShown: true, title: t('nav.packageTracking') }} />
      <Stack.Screen name="ResidentPackages" component={ResidentPackages} options={{ headerShown: true, title: t('nav.myPackages') }} />
      <Stack.Screen name="SecurityPackages" component={SecurityPackages} options={{ headerShown: true, title: t('nav.packageTracking') }} />
      <Stack.Screen name="AICargoRegistration" component={AICargoRegistration} options={{ headerShown: true, title: 'AI Cargo Kayıt' }} />
      <Stack.Screen name="QRScanner" component={QRScannerScreen} options={{ headerShown: true, title: 'QR Scanner' }} />
      <Stack.Screen name="Apartments" component={ApartmentsScreen} options={{ headerShown: true, title: t('nav.apartments') }} />
      <Stack.Screen name="SuperAdmin" component={SuperAdminScreen} options={{ headerShown: true, title: 'Super Admin' }} />
      <Stack.Screen name="SuperAdminQuickActions" component={SuperAdminQuickActions} options={{ headerShown: true, title: 'Hızlı İşlemler' }} />
      <Stack.Screen name="SuperAdminMessages" component={SuperAdminMessages} options={{ headerShown: true, title: 'Mesajlar' }} />
      <Stack.Screen name="SuperAdminProfile" component={SuperAdminProfile} options={{ headerShown: true, title: 'Profil' }} />
    </Stack.Navigator>
  );
};

const MoreMenuScreen = () => {
    const navigation = useNavigation<any>();
    const { signOut, hasRole, isImpersonating } = useAuth();
    const { t } = useI18n();
    
    
    
    // Rol bazlı menü öğeleri
    const getMenuItems = () => {
      const isResident = hasRole('ROLE_RESIDENT') && !isImpersonating; // Impersonation durumunda resident menüsü gösterme
      const isSecurity = hasRole('ROLE_SECURITY') && !isImpersonating;
      const isCleaning = hasRole('ROLE_CLEANING') && !isImpersonating;
      const isSuperAdmin = hasRole('ROLE_SUPER_ADMIN') && !isImpersonating;
      const isAdminOrImpersonating = hasRole('ROLE_ADMIN') || isImpersonating; // Impersonation durumunda admin menüsü göster
      
      // Super Admin için özel menü
      if (isSuperAdmin) {
        return [
          { label: 'Hızlı İşlemler', icon: ClipboardList, screen: 'SuperAdminQuickActions', roles: ['ROLE_SUPER_ADMIN'] },
          { label: 'Mesajlar', icon: MessageSquare, screen: 'SuperAdminMessages', roles: ['ROLE_SUPER_ADMIN'] },
          { label: t('nav.sites'), icon: Building, screen: 'Sites', roles: ['ROLE_SUPER_ADMIN'] },
          { label: 'Profil', icon: UserCircle, screen: 'SuperAdminProfile', roles: ['ROLE_SUPER_ADMIN'] },
        ];
      }
      
      if (isResident) {
        // Sakin için basit menü
        return [
          { label: t('nav.myDues'), icon: Wallet, screen: 'ResidentDues', roles: ['ROLE_RESIDENT'] },
          { label: t('nav.finance'), icon: Wallet, screen: 'ResidentFinance', roles: ['ROLE_RESIDENT'] },
          { label: t('nav.myPackages'), icon: Box, screen: 'ResidentPackages', roles: ['ROLE_RESIDENT'] },
          { label: t('nav.ticketReports'), icon: Wrench, screen: 'ResidentTickets', roles: ['ROLE_RESIDENT'] },
          { label: t('nav.maintenanceManagement'), icon: Wrench, screen: 'Maintenance', roles: ['ROLE_RESIDENT'] },
          { label: t('nav.announcements'), icon: Bell, screen: 'ResidentAnnouncements', roles: ['ROLE_RESIDENT'] },
          { label: 'Ziyaretçi Talepleri', icon: Users, screen: 'ResidentVisitorRequests', roles: ['ROLE_RESIDENT'] },
          { label: t('nav.eVoting'), icon: ClipboardList, screen: 'ResidentVoting', roles: ['ROLE_RESIDENT'] },
          { label: t('nav.profile'), icon: UserCircle, screen: 'ResidentProfile', roles: ['ROLE_RESIDENT'] },
          { label: t('nav.settings'), icon: MoreHorizontal, screen: 'ResidentSettings', roles: ['ROLE_RESIDENT'] },
        ];
      }
      
      if (isSecurity) {
        // Güvenlik için özel menü
        return [
          { label: t('nav.home'), icon: Home, screen: 'SecurityDashboard', roles: ['ROLE_SECURITY'] },
          { label: t('nav.tasks'), icon: ClipboardList, screen: 'SecurityTasks', roles: ['ROLE_SECURITY'] },
          { label: t('nav.packageTracking'), icon: Box, screen: 'SecurityPackages', roles: ['ROLE_SECURITY'] },
          { label: t('nav.openTickets'), icon: Wrench, screen: 'SecurityTickets', roles: ['ROLE_SECURITY'] },
          { label: t('nav.maintenanceManagement'), icon: Wrench, screen: 'SecurityMaintenance', roles: ['ROLE_SECURITY'] },
          { label: t('nav.visitors'), icon: Users, screen: 'Visitors', roles: ['ROLE_SECURITY'] },
          { label: 'Ziyaretçi Talepleri', icon: Users, screen: 'SecurityVisitorRequests', roles: ['ROLE_SECURITY'] },
          { label: t('nav.messages'), icon: MessageSquare, screen: 'Messages', roles: ['ROLE_SECURITY'] },
          { label: t('nav.announcements'), icon: Bell, screen: 'ResidentAnnouncements', roles: ['ROLE_SECURITY'] },
          { label: t('nav.profile'), icon: UserCircle, screen: 'Profile', roles: ['ROLE_SECURITY'] },
        ];
      }
      
      if (isCleaning) {
        // Temizlik görevlisi için özel menü (güvenlik ile aynı ama paket takip yok)
        return [
          { label: t('nav.home'), icon: Home, screen: 'CleaningDashboard', roles: ['ROLE_CLEANING'] },
          { label: t('nav.tasks'), icon: ClipboardList, screen: 'CleaningTasks', roles: ['ROLE_CLEANING'] },
          { label: t('nav.openTickets'), icon: Wrench, screen: 'CleaningTickets', roles: ['ROLE_CLEANING'] },
          { label: t('nav.maintenanceManagement'), icon: Wrench, screen: 'CleaningMaintenance', roles: ['ROLE_CLEANING'] },
          { label: t('nav.messages'), icon: MessageSquare, screen: 'Messages', roles: ['ROLE_CLEANING'] },
          { label: t('nav.announcements'), icon: Bell, screen: 'ResidentAnnouncements', roles: ['ROLE_CLEANING'] },
          { label: t('nav.profile'), icon: UserCircle, screen: 'Profile', roles: ['ROLE_CLEANING'] },
        ];
      }
      
      // Admin için detaylı menü (impersonation durumunda da göster)
      if (isAdminOrImpersonating) {
        return [
          { label: t('nav.tasks'), icon: ClipboardList, screen: 'Tasks', roles: ['ROLE_ADMIN'] },
          { label: t('nav.packageTracking'), icon: Box, screen: 'Packages', roles: ['ROLE_ADMIN'] },
          { label: t('nav.residents'), icon: Users, screen: 'Residents', roles: ['ROLE_ADMIN'] },
          { label: t('nav.finance'), icon: Wallet, screen: 'AdminFinance', roles: ['ROLE_ADMIN'] },
          { label: t('nav.maintenanceManagement'), icon: Wrench, screen: 'Maintenance', roles: ['ROLE_ADMIN'] },
          { label: t('nav.announcements'), icon: Bell, screen: 'Announcements', roles: ['ROLE_ADMIN'] },
          { label: t('nav.eVoting'), icon: ClipboardList, screen: 'AdminVoting', roles: ['ROLE_ADMIN'] },
          // { label: t('nav.shifts'), icon: Clock, screen: 'StaffShifts', roles: ['ROLE_ADMIN'] }, // Vardiyalar devre dışı
          { label: t('nav.visitors'), icon: Users, screen: 'Visitors', roles: ['ROLE_ADMIN'] },
          { label: 'Ziyaretçi Talepleri', icon: Users, screen: 'SecurityVisitorRequests', roles: ['ROLE_ADMIN'] },
          { label: t('nav.profile'), icon: UserCircle, screen: 'Profile', roles: ['ROLE_ADMIN'] },
          { label: t('nav.settings'), icon: MoreHorizontal, screen: 'Settings', roles: ['ROLE_ADMIN'] },
        ];
      }
      
      // Fallback - boş menü
      return [];
    };

    const menuItems = getMenuItems();

    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <ScrollView 
                style={{ flex: 1 }} 
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Üst Butonlar - Sadece impersonation durumunda Super Admin'e Dön */}
                {isImpersonating && (
                    <View style={{ marginBottom: 15 }}>
                        <TouchableOpacity 
                            style={{ 
                                flexDirection: 'row', 
                                alignItems: 'center', 
                                paddingVertical: 12, 
                                backgroundColor: '#f3f4f6',
                                borderRadius: 8,
                                paddingHorizontal: 15,
                                borderWidth: 1,
                                borderColor: '#e5e7eb',
                            }}
                            onPress={signOut}
                        >
                            <UserCircle size={20} color="#2563eb" style={{ marginRight: 12 }} />
                            <Text style={{ fontSize: 15, color: '#2563eb', fontWeight: '600' }}>
                                Super Admin'e Dön
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
                
                {/* Menü Sayfaları */}
                <View style={{ marginBottom: 15 }}>
                    {menuItems.map((item, index) => {
                        return (
                            <TouchableOpacity 
                                key={index}
                                style={{ 
                                    flexDirection: 'row', 
                                    alignItems: 'center', 
                                    paddingVertical: 10, 
                                    paddingHorizontal: 12,
                                    marginBottom: 6,
                                    backgroundColor: '#f9fafb',
                                    borderRadius: 6,
                                    borderWidth: 1,
                                    borderColor: '#f3f4f6',
                                }}
                                onPress={() => {
                                    if (navigation) {
                                        navigation.navigate('Dashboard', { screen: item.screen });
                                    } else {
                                        console.error('Navigation is undefined!');
                                    }
                                }}
                            >
                                <View style={{ position: 'relative', marginRight: 12 }}>
                                    <item.icon size={18} color="#4b5563" />
                                </View>
                                <Text style={{ fontSize: 14, color: '#1f2937', fontWeight: '500' }}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>
            
            {/* Çıkış Yap butonu - En altta sabit */}
            <View style={{ 
                paddingHorizontal: 20, 
                paddingVertical: 15, 
                backgroundColor: '#fff',
                borderTopWidth: 1,
                borderTopColor: '#f3f4f6',
            }}>
                <TouchableOpacity 
                    style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        paddingVertical: 15,
                        backgroundColor: '#fef2f2',
                        borderRadius: 12,
                        paddingHorizontal: 20,
                        borderWidth: 1,
                        borderColor: '#fecaca',
                        justifyContent: 'center',
                    }}
                    onPress={signOut}
                >
                    <LogOut size={22} color="#ef4444" style={{ marginRight: 15 }} />
                    <Text style={{ fontSize: 16, color: '#ef4444', fontWeight: '600' }}>
                        {isImpersonating ? 'Çıkış Yap' : t('nav.logout')}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};


const MainNavigator = () => {
  const { hasRole, isImpersonating } = useAuth();
  const { t } = useI18n();
  const { unreadMessagesCount } = useNotifications();
  
  // Rol kontrolü
  const isResident = hasRole('ROLE_RESIDENT') && !isImpersonating;
  const isAdmin = hasRole('ROLE_ADMIN') || isImpersonating;
  
  // Aidatlar tab'ı sadece Admin ve Sakin için görünür
  const showDuesTab = isAdmin || isResident;
  
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        tabBarActiveTintColor: '#0f766e',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          height: 90,
          paddingBottom: 30,
          paddingTop: 10,
          borderTopColor: '#f3f4f6',
          backgroundColor: '#ffffff',
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
        name="Dashboard" 
        component={DashboardStack}
        options={{
          tabBarLabel: t('nav.home'),
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tab.Screen 
        name="Messages" 
        component={MessagesScreen}
        options={{
          tabBarLabel: t('nav.messages'),
          tabBarIcon: ({ color }) => (
            <View>
                <MessageSquare size={24} color={color} />
                {unreadMessagesCount > 0 && (
                  <View style={{ 
                    position: 'absolute', 
                    right: -8, 
                    top: -4, 
                    backgroundColor: '#ef4444', 
                    borderRadius: 10, 
                    minWidth: 18, 
                    height: 18, 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    paddingHorizontal: 4,
                  }}>
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>
                      {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                    </Text>
                  </View>
                )}
            </View>
          ),
        }}
      />
      
      {/* Aidatlar tab'ı - Sadece Admin ve Sakin için */}
      {showDuesTab && (
        <Tab.Screen 
          name="DuesTab" 
          component={isAdmin ? AdminDues : ResidentDues}
          options={{
            tabBarLabel: t('nav.dues'),
            tabBarIcon: ({ color }) => <Wallet size={24} color={color} />,
          }}
        />
      )}
      
      {/* Arızalar tab'ı - Admin için TicketsScreen, Sakin için ResidentTickets */}
      <Tab.Screen 
        name="TicketsTab" 
        component={isAdmin ? TicketsScreen : ResidentTickets}
        options={{
          tabBarLabel: t('nav.openTickets'),
          tabBarIcon: ({ color }) => <Wrench size={24} color={color} />,
        }}
      />
      
      <Tab.Screen 
        name="More" 
        component={MoreMenuScreen}
        options={{
          tabBarLabel: t('nav.more'),
          tabBarIcon: ({ color }) => <MoreHorizontal size={24} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;

