import {
  Home,
  CreditCard,
  AlertTriangle,
  Package,
  Users,
  ClipboardList,
  Vote,
  Megaphone,
  User,
  Wallet,
  MessageCircle,
  Wrench,
  Building2,
} from 'lucide-react-native';
import type { UserRole } from '../types';
import type { TranslationKey } from './i18n';

export interface NavItem {
  id: string;
  labelKey: TranslationKey;
  icon: any;
  roles: UserRole[];
}

export const navItems: NavItem[] = [
  { 
    id: 'home', 
    labelKey: 'home', 
    icon: Home, 
    roles: ['super_admin', 'admin', 'resident', 'cleaner', 'security'] 
  },
  { 
    id: 'residents', 
    labelKey: 'residents_title', 
    icon: Users, 
    roles: ['admin'] 
  },
  { 
    id: 'sites', 
    labelKey: 'sites_title', 
    icon: Building2, 
    roles: ['admin'] 
  },
  { 
    id: 'finance', 
    labelKey: 'finance_title', 
    icon: Wallet, 
    roles: ['admin', 'resident'] 
  },
  { 
    id: 'dues', 
    labelKey: 'dues_title', 
    icon: CreditCard, 
    roles: ['admin', 'resident'] 
  },
  { 
    id: 'tickets', 
    labelKey: 'tickets_title', 
    icon: AlertTriangle, 
    roles: ['admin', 'resident'] 
  },
  { 
    id: 'maintenance', 
    labelKey: 'maintenance_title', 
    icon: Wrench, 
    roles: ['admin', 'resident'] 
  },
  { 
    id: 'tasks', 
    labelKey: 'tasks_title', 
    icon: ClipboardList, 
    roles: ['admin', 'cleaner', 'security'] 
  },
  { 
    id: 'packages', 
    labelKey: 'packages_title', 
    icon: Package, 
    roles: ['admin', 'security', 'resident'] 
  },
  {
    id: 'messages',
    labelKey: 'messages_title',
    icon: MessageCircle,
    roles: ['super_admin', 'admin', 'resident', 'cleaner', 'security'],
  },
  {
    id: 'announcements',
    labelKey: 'announcements_title',
    icon: Megaphone,
    roles: ['admin', 'resident', 'cleaner', 'security'],
  },
  { 
    id: 'voting', 
    labelKey: 'voting_title', 
    icon: Vote, 
    roles: ['admin', 'resident'] 
  },
  { 
    id: 'profile', 
    labelKey: 'profile_title', 
    icon: User, 
    roles: ['super_admin', 'admin', 'resident', 'cleaner', 'security'] 
  },
];

export const getBottomNavItems = (role: UserRole): string[] => {
  switch (role) {
    case 'super_admin':
      return ['home', 'sites', 'messages', 'profile'];
    case 'admin':
      return ['home', 'messages', 'tasks', 'packages'];
    case 'resident':
      return ['home', 'messages', 'dues', 'tickets'];
    case 'security':
      return ['home', 'messages', 'packages', 'tasks'];
    case 'cleaner':
      return ['home', 'messages', 'tasks', 'announcements'];
    default:
      return ['home', 'messages', 'profile', 'announcements'];
  }
};

export const getNavItems = (role: UserRole): NavItem[] => {
  // Super admin bir siteye girdiğinde admin menüsünü göster
  const effectiveRole = role === 'super_admin' ? 'admin' : role;
  return navItems.filter(item => item.roles.includes(effectiveRole));
};
