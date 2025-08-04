import React, { useState } from 'react';
import { Settings as SettingsIcon, User, Shield, Bell, Globe, Smartphone, Key, Database } from 'lucide-react';

export const Settings: React.FC = () => {
  const [activeSection, setActiveSection] = useState('profile');

  const sections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'trading', label: 'Trading', icon: Database },
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'preferences', label: 'Preferences', icon: Globe }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Profile Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                <input
                  type="text"
                  defaultValue="John Trader"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  defaultValue="john.trader@email.com"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                <input
                  type="tel"
                  defaultValue="+1 (555) 123-4567"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Country</label>
                <select className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option>United States</option>
                  <option>Canada</option>
                  <option>United Kingdom</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors">
              Save Changes
            </button>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Security Settings</h2>
            <div className="space-y-6">
              <div className="bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Two-Factor Authentication</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300">Secure your account with 2FA</p>
                    <p className="text-sm text-gray-400">Currently enabled</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-green-400 text-sm">Active</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Change Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors">
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Notification Settings</h2>
            <div className="space-y-4">
              {[
                { label: 'Trade Execution', description: 'Get notified when trades are executed', enabled: true },
                { label: 'Bot Status Changes', description: 'Alerts when bots start, stop, or encounter errors', enabled: true },
                { label: 'Price Alerts', description: 'Notifications for price movements', enabled: false },
                { label: 'Portfolio Updates', description: 'Daily portfolio performance summaries', enabled: true },
                { label: 'Security Alerts', description: 'Login attempts and security events', enabled: true },
                { label: 'Market News', description: 'Important cryptocurrency news and updates', enabled: false }
              ].map((notification, index) => (
                <div key={index} className="bg-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{notification.label}</h3>
                      <p className="text-sm text-gray-400">{notification.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked={notification.enabled} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'api':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">API Keys</h2>
            <div className="space-y-6">
              <div className="bg-yellow-600 bg-opacity-20 border border-yellow-600 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-yellow-400" />
                  <span className="text-yellow-400 font-semibold">Security Notice</span>
                </div>
                <p className="text-yellow-200 text-sm mt-2">
                  Never share your API keys with anyone. Enable IP restrictions and use read-only permissions when possible.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { name: 'Binance', status: 'active', permissions: 'Read, Trade', created: '2024-01-15' },
                  { name: 'Coinbase Pro', status: 'active', permissions: 'Read Only', created: '2024-02-01' },
                  { name: 'Kraken', status: 'inactive', permissions: 'Read, Trade', created: '2024-02-10' }
                ].map((api, index) => (
                  <div key={index} className="bg-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{api.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                          <span>Permissions: {api.permissions}</span>
                          <span>Created: {api.created}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          api.status === 'active' 
                            ? 'bg-green-600 bg-opacity-20 text-green-400' 
                            : 'bg-gray-600 bg-opacity-20 text-gray-400'
                        }`}>
                          {api.status.charAt(0).toUpperCase() + api.status.slice(1)}
                        </div>
                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold transition-colors">
                          Edit
                        </button>
                        <button className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold transition-colors">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors">
                Add New API Key
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Preferences</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-700 rounded-lg p-6">
                <h3 className="font-semibold mb-4">Display Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Theme</label>
                    <select className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option>Dark (Current)</option>
                      <option>Light</option>
                      <option>Auto</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Currency</label>
                    <select className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option>USD ($)</option>
                      <option>EUR (€)</option>
                      <option>GBP (£)</option>
                      <option>BTC (₿)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-6">
                <h3 className="font-semibold mb-4">Trading Preferences</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Default Trading Pair</label>
                    <select className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option>BTC/USDT</option>
                      <option>ETH/USDT</option>
                      <option>BNB/USDT</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Risk Level</label>
                    <select className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option>Conservative</option>
                      <option>Moderate</option>
                      <option>Aggressive</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center">
          <SettingsIcon className="w-8 h-8 mr-3 text-blue-400" />
          Settings
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
            <nav className="space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                      activeSection === section.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};