import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminFinance from './AdminFinance';
import ResidentFinance from './ResidentFinance';

function FinanceScreen() {
  const { hasRole } = useAuth();
  if (hasRole('ADMIN') || hasRole('SUPER_ADMIN')) return <AdminFinance />;
  return <ResidentFinance />;
}

export default FinanceScreen;
