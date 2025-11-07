import React, { useState } from 'react';
import { AuthProvider } from './components/auth/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Header from './components/common/Header';
import ErrorAlert from './components/common/ErrorAlert';
import NavigationTabs from './components/common/NavigationTabs';
import Dashboard from './components/dashboard/Dashboard';
import AssetManagement from './components/assets/AssetManagement';
import UserManagement from './components/users/UserManagement';
import Reports from './components/reports/Reports';
import Compliance from './components/compliance/Compliance';
import DeviceScanner from './components/scanner/DeviceScanner';
import ProcurementManagement from './components/procurement/ProcurementManagement'; // NEW
import { useAssets } from './hooks/useAssets';
import { useUsers } from './hooks/useUsers';

const MainApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [error, setError] = useState('');
  
  const {
    assets,
    loading: assetsLoading,
    addAsset,
    updateAsset,
    deleteAsset,
    refreshAssets
  } = useAssets();
  
  const {
    users,
    loading: usersLoading,
    addUser,
    refreshUsers,
    updateUser,
    deleteUser
  } = useUsers();

  const handleRefresh = () => {
    refreshAssets();
    refreshUsers();
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard assets={assets} users={users} />;
      case 'assets':
        return (
          <AssetManagement
            assets={assets}
            onAddAsset={addAsset}
            onUpdateAsset={updateAsset}
            onDeleteAsset={deleteAsset}
            setError={setError}
          />
        );
      case 'scanner':
        return (
          <DeviceScanner 
            apiBaseUrl="http://localhost:8000"
            onDeviceAdded={() => refreshAssets()}
            setError={setError}
          />
        );
      case 'procurement':  // NEW CASE - PROCUREMENT
        return (
          <ProcurementManagement 
            setError={setError}
          />
        );
      case 'users':
        return (
          <UserManagement
            users={users}
            onAddUser={addUser}
            setError={setError}
          />
        );
      case 'reports':
        return <Reports assets={assets} />;
      case 'compliance':
        return <Compliance assets={assets} />;
      default:
        return <Dashboard assets={assets} users={users} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        loading={assetsLoading || usersLoading} 
        onRefresh={handleRefresh} 
      />
      <ErrorAlert 
        error={error} 
        onDismiss={() => setError('')} 
      />
      <NavigationTabs 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderActiveTab()}
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <MainApp />
      </ProtectedRoute>
    </AuthProvider>
  );
};
export default App;