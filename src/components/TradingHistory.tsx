import React, { useState } from 'react';
import { History, Filter, Download, Calendar, TrendingUp, TrendingDown } from 'lucide-react';

export const TradingHistory: React.FC = () => {
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState('7d');

  const trades = [
    {
      id: 'TXN001',
      type: 'BUY',
      pair: 'BTC/USDT',
      amount: 0.2847,
      price: 43250.00,
      total: 12306.58,
      fee: 12.31,
      profit: 245.80,
      status: 'completed',
      timestamp: '2024-02-20 14:32:15',
      bot: 'BTC Grid Bot #1'
    },
    {
      id: 'TXN002',
      type: 'SELL',
      pair: 'ETH/USDT',
      amount: 5.4521,
      price: 2680.50,
      total: 14616.25,
      fee: 14.62,
      profit: 187.25,
      status: 'completed',
      timestamp: '2024-02-20 14:28:42',
      bot: 'ETH DCA Bot'
    },
    {
      id: 'TXN003',
      type: 'BUY',
      pair: 'ADA/USDT',
      amount: 1250.00,
      price: 0.485,
      total: 606.25,
      fee: 0.61,
      profit: -15.40,
      status: 'completed',
      timestamp: '2024-02-20 14:15:28',
      bot: 'Altcoin Scalper'
    },
    {
      id: 'TXN004',
      type: 'SELL',
      pair: 'SOL/USDT',
      amount: 15.75,
      price: 95.20,
      total: 1499.40,
      fee: 1.50,
      profit: 89.60,
      status: 'completed',
      timestamp: '2024-02-20 13:45:12',
      bot: 'SOL Swing Bot'
    },
    {
      id: 'TXN005',
      type: 'BUY',
      pair: 'DOT/USDT',
      amount: 142.50,
      price: 7.02,
      total: 1000.35,
      fee: 1.00,
      profit: 25.80,
      status: 'completed',
      timestamp: '2024-02-20 13:20:45',
      bot: 'Manual Trade'
    },
    {
      id: 'TXN006',
      type: 'SELL',
      pair: 'MATIC/USDT',
      amount: 850.00,
      price: 0.90,
      total: 765.00,
      fee: 0.77,
      profit: 42.30,
      status: 'completed',
      timestamp: '2024-02-20 12:55:18',
      bot: 'Multi-Pair Arbitrage'
    },
    {
      id: 'TXN007',
      type: 'BUY',
      pair: 'BTC/USDT',
      amount: 0.1523,
      price: 43180.00,
      total: 6576.51,
      fee: 6.58,
      profit: 0,
      status: 'pending',
      timestamp: '2024-02-20 12:30:22',
      bot: 'BTC Grid Bot #1'
    },
    {
      id: 'TXN008',
      type: 'SELL',
      pair: 'ETH/USDT',
      amount: 2.8456,
      price: 2675.80,
      total: 7612.45,
      fee: 7.61,
      profit: 156.90,
      status: 'completed',
      timestamp: '2024-02-20 11:45:35',
      bot: 'ETH DCA Bot'
    }
  ];

  const filteredTrades = trades.filter(trade => {
    if (filterType === 'all') return true;
    if (filterType === 'buy') return trade.type === 'BUY';
    if (filterType === 'sell') return trade.type === 'SELL';
    if (filterType === 'profitable') return trade.profit > 0;
    if (filterType === 'losses') return trade.profit < 0;
    return true;
  });

  const totalProfit = trades.reduce((sum, trade) => sum + trade.profit, 0);
  const totalTrades = trades.length;
  const winRate = (trades.filter(t => t.profit > 0).length / totalTrades * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center">
          <History className="w-8 h-8 mr-3 text-blue-400" />
          Trading History
        </h1>
        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
            <Calendar className="w-4 h-4" />
            <span>Date Range</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Trades</p>
              <p className="text-2xl font-bold">{totalTrades}</p>
            </div>
            <History className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total P&L</p>
              <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}
              </p>
            </div>
            {totalProfit >= 0 ? (
              <TrendingUp className="w-8 h-8 text-green-400" />
            ) : (
              <TrendingDown className="w-8 h-8 text-red-400" />
            )}
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Win Rate</p>
              <p className="text-2xl font-bold text-green-400">{winRate.toFixed(1)}%</p>
            </div>
            <div className="w-8 h-8 bg-green-600 bg-opacity-20 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-green-400 rounded-full"></div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg Trade Size</p>
              <p className="text-2xl font-bold">
                ${(trades.reduce((sum, t) => sum + t.total, 0) / totalTrades).toFixed(0)}
              </p>
            </div>
            <div className="w-8 h-8 bg-purple-600 bg-opacity-20 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-purple-400 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
        <div className="flex space-x-2">
          {[
            { key: 'all', label: 'All Trades' },
            { key: 'buy', label: 'Buy Orders' },
            { key: 'sell', label: 'Sell Orders' },
            { key: 'profitable', label: 'Profitable' },
            { key: 'losses', label: 'Losses' }
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setFilterType(filter.key)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterType === filter.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Trading History Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-4 font-semibold">ID</th>
                <th className="text-left p-4 font-semibold">Type</th>
                <th className="text-left p-4 font-semibold">Pair</th>
                <th className="text-right p-4 font-semibold">Amount</th>
                <th className="text-right p-4 font-semibold">Price</th>
                <th className="text-right p-4 font-semibold">Total</th>
                <th className="text-right p-4 font-semibold">Fee</th>
                <th className="text-right p-4 font-semibold">P&L</th>
                <th className="text-left p-4 font-semibold">Bot</th>
                <th className="text-left p-4 font-semibold">Time</th>
                <th className="text-center p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrades.map((trade) => (
                <tr key={trade.id} className="border-t border-gray-700 hover:bg-gray-700 transition-colors">
                  <td className="p-4 font-medium text-blue-400">{trade.id}</td>
                  <td className="p-4">
                    <div className={`px-2 py-1 rounded text-xs font-semibold inline-block ${
                      trade.type === 'BUY' ? 'bg-green-600 text-green-100' : 'bg-red-600 text-red-100'
                    }`}>
                      {trade.type}
                    </div>
                  </td>
                  <td className="p-4 font-medium">{trade.pair}</td>
                  <td className="p-4 text-right">
                    {trade.amount.toLocaleString(undefined, { 
                      minimumFractionDigits: 4,
                      maximumFractionDigits: 4 
                    })}
                  </td>
                  <td className="p-4 text-right">
                    ${trade.price.toLocaleString('en-US', { 
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 4 
                    })}
                  </td>
                  <td className="p-4 text-right font-semibold">
                    ${trade.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-4 text-right text-gray-400">
                    ${trade.fee.toFixed(2)}
                  </td>
                  <td className="p-4 text-right">
                    {trade.profit !== 0 ? (
                      <span className={`font-semibold ${trade.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-gray-400">{trade.bot}</td>
                  <td className="p-4 text-sm text-gray-400">{trade.timestamp}</td>
                  <td className="p-4 text-center">
                    <div className={`px-2 py-1 rounded text-xs font-semibold inline-block ${
                      trade.status === 'completed' 
                        ? 'bg-green-600 bg-opacity-20 text-green-400' 
                        : 'bg-yellow-600 bg-opacity-20 text-yellow-400'
                    }`}>
                      {trade.status.charAt(0).toUpperCase() + trade.status.slice(1)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};