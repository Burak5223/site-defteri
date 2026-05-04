import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminProfile from './AdminProfile';
import ResidentProfile from './ResidentProfile';

function ProfileScreen() {
  const { hasRole } = useAuth();
  if (hasRole('ADMIN') || hasRole('SUPER_ADMIN')) return <AdminProfile />;
  return <ResidentProfile />;
}

export default ProfileScreen;
