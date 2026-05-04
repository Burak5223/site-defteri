import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminNotifications from './AdminNotifications';
import ResidentNotifications from './ResidentNotifications';

function NotificationsScreen() {
  const { hasRole } = useAuth();
  if (hasRole('ADMIN') || hasRole('SUPER_ADMIN')) return <AdminNotifications />;
  return <ResidentNotifications />;
}

export default NotificationsScreen;
