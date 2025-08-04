import React from 'react';
import { TrendingUp, TrendingDown, Activity, DollarSign, Bot, Wallet } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const stats = [
    {
      title: 'Total Balance',
      value: '$127,453.80',
      change: '+12.3%',
      positive: true,
      icon: DollarSign,
      color: 'blue'
    },
    {
      title: 'Active Bots',
      value: '8',
      change: '+2',
      positive: true,
      icon: Bot,
      color: 'green'
    },
    {
      title: 'Today\'s P&L',
      value: '+$2,847.50',
      change: '+5.8%',
      positive: true,
      icon: TrendingUp,
      color: 'emerald'
    },
    {
      title: 'Portfolio Growth',
      value: '+23.4%',
      change: 'This month',
      positive: true,
      icon: Activity,
      color: 'purple'
    }
  ];

  const recentTrades = [
    { pair: 'BTC/USDT', type: 'BUY', amount: '0.2847', price: '$43,250.00', profit: '+$245.80', time: '2 min ago' },
    { pair: 'ETH/USDT', type: 'SELL', amount: '5.4521', price: '$2,680.50', profit: '+$187.25', time: '5 min ago' },
    { pair: 'ADA/USDT', type: 'BUY', amount: '1,250.00', price: '$0.485', profit: '-$15.40', time: '12 min ago' },
    { pair: 'SOL/USDT', type: 'SELL', amount: '15.75', price: '$95.20', profit: '+$89.60', time: '18 min ago' },
  ];

  const activeBots = [
    { name: 'BTC Grid Bot #1', pair: 'BTC/USDT', profit: '+$1,247.80', status: 'Running', performance: '95%' },
    { name: 'ETH DCA Bot', pair: 'ETH/USDT', profit: '+$856.20', status: 'Running', performance: '88%' },
    { name: 'Altcoin Scalper', pair: 'ADA/USDT', profit: '-$45.60', status: 'Paused', performance: '72%' },
    { name: 'SOL Swing Bot', pair: 'SOL/USDT', profit: '+$423.90', status: 'Running', performance: '91%' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="text-sm text-gray-400">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">{stat.title}</p>
                  <p className="text-2xl font-bold mt-2">{stat.value}</p>
                  <div className={`flex items-center mt-2 text-sm ${stat.positive ? 'text-green-400' : 'text-red-400'}`}>
                    {stat.positive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Trades */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-400" />
            Recent Trades
          </h2>
          <div className="space-y-4">
            {recentTrades.map((trade, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-700">
                <div className="flex items-center space-x-4">
                  <div className={`px-2 py-1 rounded text-xs font-semibold ${
                    trade.type === 'BUY' ? 'bg-green-600 text-green-100' : 'bg-red-600 text-red-100'
                  }`}>
                    {trade.type}
                  </div>
                  <div>
                    <div className="font-medium">{trade.pair}</div>
                    <div className="text-sm text-gray-400">{trade.amount} @ {trade.price}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${trade.profit.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                    {trade.profit}
                  </div>
                  <div className="text-sm text-gray-400">{trade.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Bots */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <Bot className="w-5 h-5 mr-2 text-green-400" />
            Active Bots
          </h2>
          <div className="space-y-4">
            {activeBots.map((bot, index) => (
              <div key={index} className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{bot.name}</div>
                  <div className={`px-2 py-1 rounded text-xs font-semibold ${
                    bot.status === 'Running' ? 'bg-green-600 text-green-100' : 'bg-yellow-600 text-yellow-100'
                  }`}>
                    {bot.status}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="text-gray-400">{bot.pair}</div>
                  <div className={`font-semibold ${bot.profit.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                    {bot.profit}
                  </div>
                </div>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span>Performance</span>
                    <span>{bot.performance}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: bot.performance }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};