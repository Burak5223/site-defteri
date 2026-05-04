import React from 'react';
import { MainTabs } from './MainTabs';
import type { UserRole } from '../types';

const MainNavigator = () => {
  // TODO: Get actual user role from AuthContext
  const userRole: UserRole = 'resident';

  return <MainTabs role={userRole} lang="tr" />;
};

export default MainNavigator;
