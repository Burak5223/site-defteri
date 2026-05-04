import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminSettings from './AdminSettings';
import ResidentSettings from './ResidentSettings';

function SettingsScreen() {
  const { hasRole } = useAuth();
  if (hasRole('ADMIN') || hasRole('SUPER_ADMIN')) return <AdminSettings />;
  return <ResidentSettings />;
}

export default SettingsScreen;
