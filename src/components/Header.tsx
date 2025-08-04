import React from 'react';
import { Menu, Bell, User, TrendingUp } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-8 h-8 text-blue-500" />
            <h1 className="text-xl font-bold">CryptoTrader Pro</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400">Market Open</span>
            </div>
            <div className="text-gray-400">
              BTC: <span className="text-green-400">$43,250.00</span>
            </div>
            <div className="text-gray-400">
              ETH: <span className="text-green-400">$2,680.50</span>
            </div>
          </div>
          
          <button className="p-2 rounded-md hover:bg-gray-700 transition-colors relative">
            <Bell className="w-5 h-5" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
          </button>
          
          <button className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-700 transition-colors">
            <User className="w-5 h-5" />
            <span className="hidden sm:inline">John Trader</span>
          </button>
        </div>
      </div>
    </header>
  );
};