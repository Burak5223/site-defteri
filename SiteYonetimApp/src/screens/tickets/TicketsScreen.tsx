import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminTickets from './AdminTickets';
import ResidentTickets from './ResidentTickets';

function TicketsScreen() {
  const { hasRole } = useAuth();
  if (hasRole('ADMIN') || hasRole('SUPER_ADMIN')) return <AdminTickets />;
  return <ResidentTickets />;
}

export default TicketsScreen;
