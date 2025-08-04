import React, { useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, RefreshCw, Eye, EyeOff } from 'lucide-react';

export const Portfolio: React.FC = () => {
  const [showBalances, setShowBalances] = useState(true);

  const portfolioData = [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      balance: 2.847521,
      value: 123047.85,
      change24h: 2.34,
      allocation: 45.2,
      avgBuyPrice: 41250.00
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      balance: 45.2156,
      value: 121156.84,
      change24h: -1.45,
      allocation: 44.5,
      avgBuyPrice: 2580.00
    },
    {
      symbol: 'ADA',
      name: 'Cardano',
      balance: 12500.00,
      value: 6062.50,
      change24h: 5.67,
      allocation: 2.2,
      avgBuyPrice: 0.42
    },
    {
      symbol: 'SOL',
      name: 'Solana',
      balance: 85.75,
      value: 8164.40,
      change24h: -3.21,
      allocation: 3.0,
      avgBuyPrice: 89.20
    },
    {
      symbol: 'DOT',
      name: 'Polkadot',
      balance: 450.25,
      value: 3151.75,
      change24h: 1.87,
      allocation: 1.2,
      avgBuyPrice: 6.80
    },
    {
      symbol: 'MATIC',
      name: 'Polygon',
      balance: 2850.00,
      value: 2565.00,
      change24h: 8.92,
      allocation: 0.9,
      avgBuyPrice: 0.85
    },
    {
      symbol: 'USDT',
      name: 'Tether',
      balance: 15420.50,
      value: 15420.50,
      change24h: 0.01,
      allocation: 5.7,
      avgBuyPrice: 1.00
    }
  ];

  const totalValue = portfolioData.reduce((sum, asset) => sum + asset.value, 0);
  const totalChange24h = portfolioData.reduce((sum, asset) => sum + (asset.value * asset.change24h / 100), 0);
  const totalChangePercent = (totalChange24h / (totalValue - totalChange24h)) * 100;

  const exchanges = [
    { name: 'Binance', balance: 156420.50, percentage: 58.2 },
    { name: 'Coinbase Pro', balance: 78520.30, percentage: 29.2 },
    { name: 'Kraken', balance: 33840.25, percentage: 12.6 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center">
          <Wallet className="w-8 h-8 mr-3 text-blue-400" />
          Portfolio
        </h1>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setShowBalances(!showBalances)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            {showBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showBalances ? 'Hide' : 'Show'} Balances</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Total Portfolio Value</h2>
          <div className="flex items-end space-x-4">
            <div className="text-4xl font-bold">
              {showBalances ? `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '••••••••'}
            </div>
            <div className={`flex items-center space-x-1 text-lg font-semibold ${totalChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalChangePercent >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              <span>{totalChangePercent >= 0 ? '+' : ''}{totalChangePercent.toFixed(2)}%</span>
              <span className="text-sm text-gray-400">24h</span>
            </div>
          </div>
          <div className="mt-2 text-gray-400">
            24h Change: <span className={totalChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}>
              {totalChangePercent >= 0 ? '+' : ''}${Math.abs(totalChange24h).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Exchange Distribution</h2>
          <div className="space-y-3">
            {exchanges.map((exchange, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-blue-400' : 'bg-purple-400'
                  }`}></div>
                  <span className="font-medium">{exchange.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {showBalances ? `$${exchange.balance.toLocaleString()}` : '••••••'}
                  </div>
                  <div className="text-sm text-gray-400">{exchange.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold">Assets</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-4 font-semibold">Asset</th>
                <th className="text-right p-4 font-semibold">Balance</th>
                <th className="text-right p-4 font-semibold">Value</th>
                <th className="text-right p-4 font-semibold">24h Change</th>
                <th className="text-right p-4 font-semibold">Allocation</th>
                <th className="text-right p-4 font-semibold">Avg Buy Price</th>
                <th className="text-right p-4 font-semibold">P&L</th>
              </tr>
            </thead>
            <tbody>
              {portfolioData.map((asset, index) => {
                const currentPrice = asset.value / asset.balance;
                const pnl = (currentPrice - asset.avgBuyPrice) / asset.avgBuyPrice * 100;
                
                return (
                  <tr key={index} className="border-t border-gray-700 hover:bg-gray-700 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-600 bg-opacity-20 rounded-full flex items-center justify-center">
                          <span className="text-blue-400 font-semibold text-sm">{asset.symbol}</span>
                        </div>
                        <div>
                          <div className="font-semibold">{asset.symbol}</div>
                          <div className="text-sm text-gray-400">{asset.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-medium">
                        {showBalances ? asset.balance.toLocaleString(undefined, { 
                          minimumFractionDigits: asset.symbol === 'USDT' ? 2 : 4,
                          maximumFractionDigits: asset.symbol === 'USDT' ? 2 : 4 
                        }) : '••••••'}
                      </div>
                      <div className="text-sm text-gray-400">{asset.symbol}</div>
                    </td>
                    <td className="p-4 text-right font-semibold">
                      {showBalances ? `$${asset.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '••••••'}
                    </td>
                    <td className="p-4 text-right">
                      <div className={`flex items-center justify-end space-x-1 ${asset.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {asset.change24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span>{asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <span>{asset.allocation}%</span>
                        <div className="w-16 bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(asset.allocation * 2, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right text-gray-400">
                      ${asset.avgBuyPrice.toFixed(asset.symbol === 'BTC' || asset.symbol === 'ETH' ? 2 : 4)}
                    </td>
                    <td className="p-4 text-right">
                      <div className={`font-semibold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};