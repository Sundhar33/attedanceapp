import React, { createContext, useState } from 'react';

export const AppDataContext = createContext();

export const AppDataProvider = ({ children }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  const loadDashboardOnce = async (fetchFn) => {
    if (dashboardData) return; // prevent repeated DB reads
    setLoadingDashboard(true);
    const data = await fetchFn();
    setDashboardData(data);
    setLoadingDashboard(false);
  };

  return (
    <AppDataContext.Provider
      value={{
        dashboardData,
        loadingDashboard,
        loadDashboardOnce,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};
