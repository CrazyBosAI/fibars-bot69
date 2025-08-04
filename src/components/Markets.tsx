import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Search, Star, Volume2 } from 'lucide-react';

export const Markets: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const marketData = [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      price: 43250.00,
      change24h: 2.34,
      volume24h: 28945000000,
      marketCap: 847230000000,
      favorite: true
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      price: 2680.50,
      change24h: -1.45,
      volume24h: 15420000000,
      marketCap: 322150000000,
      favorite: true
    },
    {
      symbol: 'BNB',
      name: 'BNB',
      price: 315.80,
      change24h: 3.21,
      volume24h: 1250000000,
      marketCap: 48720000000,
      favorite: false
    },
    {
      symbol: 'XRP',
      name: 'XRP',
      price: 0.5847,
      change24h: -2.15,
      volume24h: 2150000000,
      marketCap: 31420000000,
      favorite: false
    },
    {
      symbol: 'ADA',
      name: 'Cardano',
      price: 0.4851,
      change24h: 5.67,
      volume24h: 850000000,
      marketCap: 17230000000,
      favorite: true
    },
    {
      symbol: 'SOL',
      name: 'Solana',
      price: 95.20,
      change24h: -3.21,
      volume24h: 1840000000,
      marketCap: 42150000000,
      favorite: false
    },
    {
      symbol: 'DOGE',
      name: 'Dogecoin',
      price: 0.0847,
      change24h: 8.92,
      volume24h: 945000000,
      marketCap: 12040000000,
      favorite: false
    },
    {
      symbol: 'DOT',
      name: 'Polkadot',
      price: 7.02,
      change24h: 1.87,
      volume24h: 420000000,
      marketCap: 9850000000,
      favorite: false
    },
    {
      symbol: 'MATIC',
      name: 'Polygon',
      price: 0.9,
      change24h: 4.35,
      volume24h: 380000000,
      marketCap: 8420000000,
      favorite: false
    },
    {
      symbol: 'AVAX',
      name: 'Avalanche',
      price: 36.42,
      change24h: -1.89,
      volume24h: 520000000,
      marketCap: 13720000000,
      favorite: false
    }
  ];

  const filteredData = marketData.filter(coin => {
    const matchesSearch = coin.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         coin.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || (activeTab === 'favorites' && coin.favorite);
    return matchesSearch && matchesTab;
  });

  const formatNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center">
          <TrendingUp className="w-8 h-8 mr-3 text-blue-400" />
          Markets
        </h1>
        <div className="text-sm text-gray-400">
          Global Market Cap: <span className="text-white font-semibold">$1.67T</span>
          <span className="ml-4 text-green-400">+2.4%</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search cryptocurrencies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex space-x-2">
          {['all', 'favorites'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tab === 'favorites' ? (
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4" />
                  <span>Favorites</span>
                </div>
              ) : (
                'All Markets'
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Market Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Bitcoin Dominance</p>
              <p className="text-2xl font-bold">50.8%</p>
              <div className="flex items-center mt-2 text-sm text-green-400">
                <TrendingUp className="w-4 h-4 mr-1" />
                +0.3%
              </div>
            </div>
            <div className="w-12 h-12 bg-orange-600 bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-orange-400 font-bold">₿</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">24h Volume</p>
              <p className="text-2xl font-bold">$52.4B</p>
              <div className="flex items-center mt-2 text-sm text-red-400">
                <TrendingDown className="w-4 h-4 mr-1" />
                -5.2%
              </div>
            </div>
            <Volume2 className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Coins</p>
              <p className="text-2xl font-bold">13,247</p>
              <div className="flex items-center mt-2 text-sm text-green-400">
                <TrendingUp className="w-4 h-4 mr-1" />
                +15
              </div>
            </div>
            <div className="w-8 h-8 bg-purple-600 bg-opacity-20 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-purple-400 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Markets Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-4 font-semibold">#</th>
                <th className="text-left p-4 font-semibold">Name</th>
                <th className="text-right p-4 font-semibold">Price</th>
                <th className="text-right p-4 font-semibold">24h Change</th>
                <th className="text-right p-4 font-semibold">24h Volume</th>
                <th className="text-right p-4 font-semibold">Market Cap</th>
                <th className="text-center p-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((coin, index) => (
                <tr key={coin.symbol} className="border-t border-gray-700 hover:bg-gray-700 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <button className={`text-gray-400 hover:text-yellow-400 transition-colors ${coin.favorite ? 'text-yellow-400' : ''}`}>
                        <Star className="w-4 h-4" fill={coin.favorite ? 'currentColor' : 'none'} />
                      </button>
                      <span className="font-medium">{index + 1}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 bg-opacity-20 rounded-full flex items-center justify-center">
                        <span className="text-blue-400 font-semibold text-sm">{coin.symbol}</span>
                      </div>
                      <div>
                        <div className="font-semibold">{coin.name}</div>
                        <div className="text-sm text-gray-400">{coin.symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-right font-semibold">
                    ${coin.price.toLocaleString('en-US', { 
                      minimumFractionDigits: coin.price >= 1 ? 2 : 4,
                      maximumFractionDigits: coin.price >= 1 ? 2 : 4 
                    })}
                  </td>
                  <td className="p-4 text-right">
                    <div className={`flex items-center justify-end space-x-1 font-semibold ${coin.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {coin.change24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span>{coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%</span>
                    </div>
                  </td>
                  <td className="p-4 text-right text-gray-300">
                    {formatNumber(coin.volume24h)}
                  </td>
                  <td className="p-4 text-right text-gray-300">
                    {formatNumber(coin.marketCap)}
                  </td>
                  <td className="p-4 text-center">
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold transition-colors">
                      Trade
                    </button>
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