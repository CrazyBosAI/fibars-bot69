import React, { useState, useEffect } from 'react';
import { Shield, Users, Bot, DollarSign, TrendingUp, Activity, AlertTriangle, Settings } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalBots: number;
  runningBots: number;
  totalVolume: number;
  totalProfit: number;
  subscriptionRevenue: number;
  pendingWithdrawals: number;
}

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalBots: 0,
    runningBots: 0,
    totalVolume: 0,
    totalProfit: 0,
    subscriptionRevenue: 0,
    pendingWithdrawals: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      // Fetch user statistics
      const { data: users } = await supabase
        .from('users')
        .select('id, created_at, subscription_status');

      // Fetch bot statistics
      const { data: bots } = await supabase
        .from('trading_bots')
        .select('id, status, total_profit, initial_balance');

      // Fetch trade volume
      const { data: trades } = await supabase
        .from('trades')
        .select('executed_price, executed_quantity, profit_loss');

      // Fetch subscription revenue
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('plan_price, status');

      const totalUsers = users?.length || 0;
      const activeUsers = users?.filter(u => u.subscription_status === 'active').length || 0;
      const totalBots = bots?.length || 0;
      const runningBots = bots?.filter(b => b.status === 'running').length || 0;
      
      const totalVolume = trades?.reduce((sum, trade) => {
        return sum + ((trade.executed_price || 0) * (trade.executed_quantity || 0));
      }, 0) || 0;

      const totalProfit = bots?.reduce((sum, bot) => sum + (bot.total_profit || 0), 0) || 0;
      
      const subscriptionRevenue = subscriptions?.reduce((sum, sub) => {
        return sub.status === 'active' ? sum + (sub.plan_price || 0) : sum;
      }, 0) || 0;

      setStats({
        totalUsers,
        activeUsers,
        totalBots,
        runningBots,
        totalVolume,
        totalProfit,
        subscriptionRevenue,
        pendingWithdrawals: 0, // This would come from a withdrawals table
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      change: '+12.5%',
      positive: true,
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Active Subscribers',
      value: stats.activeUsers.toLocaleString(),
      change: '+8.2%',
      positive: true,
      icon: TrendingUp,
      color: 'green'
    },
    {
      title: 'Total Bots',
      value: stats.totalBots.toLocaleString(),
      change: '+15.3%',
      positive: true,
      icon: Bot,
      color: 'purple'
    },
    {
      title: 'Running Bots',
      value: stats.runningBots.toLocaleString(),
      change: '+5.7%',
      positive: true,
      icon: Activity,
      color: 'emerald'
    },
    {
      title: 'Total Volume',
      value: `$${(stats.totalVolume / 1000000).toFixed(1)}M`,
      change: '+23.1%',
      positive: true,
      icon: DollarSign,
      color: 'yellow'
    },
    {
      title: 'Platform Profit',
      value: `$${stats.totalProfit.toLocaleString()}`,
      change: '+18.9%',
      positive: true,
      icon: TrendingUp,
      color: 'green'
    },
    {
      title: 'Monthly Revenue',
      value: `$${stats.subscriptionRevenue.toLocaleString()}`,
      change: '+11.4%',
      positive: true,
      icon: DollarSign,
      color: 'blue'
    },
    {
      title: 'Pending Issues',
      value: '3',
      change: '-2',
      positive: true,
      icon: AlertTriangle,
      color: 'red'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center">
            <Shield className="w-8 h-8 mr-3 text-red-400" />
            Admin Dashboard
          </h1>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-400">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
            <button className="p-2 rounded-md hover:bg-gray-700 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 border-b border-gray-700 px-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'users', label: 'Users' },
            { id: 'bots', label: 'Bots' },
            { id: 'trades', label: 'Trades' },
            { id: 'subscriptions', label: 'Subscriptions' },
            { id: 'settings', label: 'Settings' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm font-medium">{stat.title}</p>
                        <p className="text-2xl font-bold mt-2">{stat.value}</p>
                        <div className={`flex items-center mt-2 text-sm ${stat.positive ? 'text-green-400' : 'text-red-400'}`}>
                          <TrendingUp className="w-4 h-4 mr-1" />
                          {stat.change}
                        </div>
                      </div>
                      <div className={`p-3 rounded-full bg-${stat.color}-600 bg-opacity-20`}>
                        <Icon className={`w-6 h-6 text-${stat.color}-400`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Recent User Registrations</h3>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-600 bg-opacity-20 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <div className="font-medium">user{i}@example.com</div>
                          <div className="text-sm text-gray-400">{i} hours ago</div>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-green-600 bg-opacity-20 text-green-400 text-xs rounded">
                        Free
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4">System Alerts</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-red-600 bg-opacity-20 border border-red-600 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-red-400 font-medium">High API Error Rate</span>
                    </div>
                    <p className="text-red-200 text-sm mt-1">Binance API errors increased by 15%</p>
                  </div>
                  
                  <div className="p-3 bg-yellow-600 bg-opacity-20 border border-yellow-600 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400 font-medium">Server Load Warning</span>
                    </div>
                    <p className="text-yellow-200 text-sm mt-1">CPU usage at 85% for the last hour</p>
                  </div>
                  
                  <div className="p-3 bg-blue-600 bg-opacity-20 border border-blue-600 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-blue-400" />
                      <span className="text-blue-400 font-medium">New Feature Deployed</span>
                    </div>
                    <p className="text-blue-200 text-sm mt-1">Signal bot functionality is now live</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-gray-800 rounded-xl border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-lg font-semibold">User Management</h3>
            </div>
            <div className="p-6">
              <div className="text-center text-gray-400">
                User management interface would be implemented here with user search, 
                subscription management, and user activity monitoring.
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bots' && (
          <div className="bg-gray-800 rounded-xl border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-lg font-semibold">Bot Management</h3>
            </div>
            <div className="p-6">
              <div className="text-center text-gray-400">
                Bot management interface would be implemented here with bot monitoring, 
                performance analytics, and system-wide bot controls.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};