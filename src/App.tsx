import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { CreateBotModal } from './components/bots/CreateBotModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { SubscriptionPage } from './components/subscription/SubscriptionPage';
import { ReferralPage } from './components/referrals/ReferralPage';
import { Dashboard } from './components/Dashboard';
import { TradingBots } from './components/TradingBots';
import { Portfolio } from './components/Portfolio';
import { Markets } from './components/Markets';
import { TradingHistory } from './components/TradingHistory';
import { Settings } from './components/Settings';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';

export type TabType = 'dashboard' | 'bots' | 'portfolio' | 'markets' | 'history' | 'settings' | 'subscription' | 'referrals';

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createBotModalOpen, setCreateBotModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'bots':
        return <TradingBots onCreateBot={() => setCreateBotModalOpen(true)} />;
      case 'portfolio':
        return <Portfolio />;
      case 'markets':
        return <Markets />;
      case 'history':
        return <TradingHistory />;
      case 'settings':
        return <Settings />;
      case 'subscription':
        return <SubscriptionPage />;
      case 'referrals':
        return <ReferralPage />;
      case 'subscription':
        return <SubscriptionPage />;
      case 'referrals':
        return <ReferralPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 lg:ml-64 p-6">
          {renderContent()}
        </main>
        
        <CreateBotModal
          isOpen={createBotModalOpen}
          onClose={() => setCreateBotModalOpen(false)}
          onBotCreated={() => {
            setCreateBotModalOpen(false);
            // Refresh bots list if on bots tab
            if (activeTab === 'bots') {
              window.location.reload();
            }
          }}
        />
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/*" element={<MainApp />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;