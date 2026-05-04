import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import ResidentDashboard from './ResidentDashboard';
import { SecurityDashboard } from './SecurityDashboard';
import { CleaningDashboard } from './CleaningDashboard';
import SuperAdminScreen from '../superadmin/SuperAdminScreen';

function DashboardScreen() {
  const { hasRole, isImpersonating, user } = useAuth();



  // Super Admin ekranı - sadece impersonation yapmıyorsa
  if (hasRole('ROLE_SUPER_ADMIN') && !isImpersonating) {
    return <SuperAdminScreen />;
  }

  // Impersonation durumunda veya normal admin - AdminDashboard göster
  if (isImpersonating || hasRole('ROLE_ADMIN')) {
    return <AdminDashboard />;
  }

  if (hasRole('ROLE_SECURITY')) {
    return <SecurityDashboard />;
  }

  if (hasRole('ROLE_CLEANING')) {
    return <CleaningDashboard />;
  }


  return <ResidentDashboard />;
}

export default DashboardScreen;
