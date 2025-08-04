import React from 'react';
import { X, BarChart3, Bot, Wallet, TrendingUp, History, Settings, CreditCard, Gift } from 'lucide-react';
import { TabType } from '../App';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, isOpen, onClose }) => {
  const menuItems = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: BarChart3 },
    { id: 'bots' as TabType, label: 'Trading Bots', icon: Bot },
    { id: 'portfolio' as TabType, label: 'Portfolio', icon: Wallet },
    { id: 'markets' as TabType, label: 'Markets', icon: TrendingUp },
    { id: 'history' as TabType, label: 'History', icon: History },
    { id: 'subscription' as TabType, label: 'Subscription', icon: CreditCard },
    { id: 'referrals' as TabType, label: 'Referrals', icon: Gift },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed top-16 left-0 z-50 w-64 h-[calc(100vh-4rem)] bg-gray-800 border-r border-gray-700
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:top-0 lg:h-[calc(100vh-4rem)]
      `}>
        <div className="p-6">
          <button
            onClick={onClose}
            className="lg:hidden absolute top-4 right-4 p-2 rounded-md hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
          
          <nav className="space-y-2 mt-8 lg:mt-0">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    onClose();
                  }}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200
                    ${activeTab === item.id 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};