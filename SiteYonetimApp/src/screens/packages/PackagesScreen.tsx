import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminPackages from '../../screens/packages/AdminPackages';
import ResidentPackages from '../../screens/packages/ResidentPackages';
import { SecurityPackages } from '../../screens/packages/SecurityPackages';

function PackagesScreen() {
  const { hasRole } = useAuth();
  if (hasRole('ADMIN') || hasRole('SUPER_ADMIN')) return <AdminPackages />;
  if (hasRole('SECURITY')) return <SecurityPackages />;
  return <ResidentPackages />;
}

export default PackagesScreen;
