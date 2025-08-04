import React, { useState } from 'react';
import { useEffect } from 'react';
import { Bot, Plus, Play, Pause, Settings, TrendingUp, AlertCircle } from 'lucide-react';
import { supabase, TradingBot } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface TradingBotsProps {
  onCreateBot: () => void;
}

export const TradingBots: React.FC<TradingBotsProps> = ({ onCreateBot }) => {
  const { userProfile } = useAuth();
  const [activeFilter, setActiveFilter] = useState('all');
  const [bots, setBots] = useState<TradingBot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile) {
      fetchBots();
    }
  }, [userProfile]);

  const fetchBots = async () => {
    try {
      const { data, error } = await supabase
        .from('trading_bots')
        .select(`
          *,
          exchange:exchanges(*),
          api_key:api_keys(*)
        `)
        .eq('user_id', userProfile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBots(data || []);
    } catch (error) {
      console.error('Error fetching bots:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBots = bots.filter(bot => {
    if (activeFilter === 'all') return true;
    return bot.status === activeFilter;
  });

  const handleBotAction = async (botId: string, action: 'start' | 'stop' | 'pause') => {
    try {
      // Call backend API to control bot
      const response = await fetch(`/api/bots/${botId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Refresh bots list
        await fetchBots();
      }
    } catch (error) {
      console.error(`Error ${action}ing bot:`, error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-400 bg-green-600';
      case 'paused': return 'text-yellow-400 bg-yellow-600';
      case 'stopped': return 'text-red-400 bg-red-600';
      default: return 'text-gray-400 bg-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Play className="w-3 h-3" />;
      case 'paused': return <Pause className="w-3 h-3" />;
      case 'stopped': return <AlertCircle className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center">
          <Bot className="w-8 h-8 mr-3 text-blue-400" />
          Trading Bots
        </h1>
        <button 
          onClick={onCreateBot}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Create Bot</span>
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Bots</p>
              <p className="text-2xl font-bold">{bots.length}</p>
            </div>
            <Bot className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Running</p>
              <p className="text-2xl font-bold text-green-400">{bots.filter(b => b.status === 'running').length}</p>
            </div>
            <Play className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Profit</p>
              <p className="text-2xl font-bold text-green-400">
                +${bots.reduce((sum, bot) => sum + Math.max(0, bot.total_profit), 0).toFixed(2)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Trades</p>
              <p className="text-2xl font-bold">{bots.reduce((sum, bot) => sum + bot.total_trades, 0)}</p>
            </div>
            <div className="w-8 h-8 bg-purple-600 bg-opacity-20 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-purple-400 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-4 border-b border-gray-700">
        {['all', 'running', 'paused', 'stopped'].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`pb-4 px-2 text-sm font-medium transition-all duration-200 ${
              activeFilter === filter
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
            <span className="ml-2 px-2 py-1 bg-gray-700 rounded-full text-xs">
              {filter === 'all' ? bots.length : bots.filter(b => b.status === filter).length}
            </span>
          </button>
        ))}
      </div>

      {/* Bots List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading bots...</p>
          </div>
        ) : filteredBots.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No bots found</h3>
            <p className="text-gray-500 mb-6">Create your first trading bot to get started</p>
            <button 
              onClick={onCreateBot}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Create Your First Bot
            </button>
          </div>
        ) : (
          filteredBots.map((bot) => (
          <div key={bot.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-600 bg-opacity-20 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{bot.name}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span>{bot.trading_pair}</span>
                    <span>•</span>
                    <span>{bot.strategy_type}</span>
                    <span>•</span>
                    <span>Created {new Date(bot.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="text-right">
                  <div className={`text-lg font-semibold ${bot.total_profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {bot.total_profit >= 0 ? '+' : ''}${bot.total_profit.toFixed(2)}
                  </div>
                  <div className={`text-sm ${((bot.total_profit / bot.initial_balance) * 100) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {((bot.total_profit / bot.initial_balance) * 100).toFixed(2)}%
                  </div>
                </div>
                
                <div className="text-right text-sm text-gray-400">
                  <div>{bot.total_trades} trades</div>
                  <div>Last: {bot.last_trade_at ? new Date(bot.last_trade_at).toLocaleString() : 'Never'}</div>
                </div>
                
                <div className={`px-3 py-1 rounded-full text-xs font-semibold bg-opacity-20 flex items-center space-x-1 ${getStatusColor(bot.status)}`}>
                  {getStatusIcon(bot.status)}
                  <span>{bot.status.charAt(0).toUpperCase() + bot.status.slice(1)}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="p-2 rounded-lg hover:bg-gray-700 transition-colors">
                    <Settings className="w-5 h-5" />
                  </button>
                  <button className={`p-2 rounded-lg transition-colors ${
                    bot.status === 'running' 
                      ? 'hover:bg-yellow-600 hover:bg-opacity-20 text-yellow-400' 
                      : 'hover:bg-green-600 hover:bg-opacity-20 text-green-400'
                  }`}
                  onClick={() => handleBotAction(bot.id, bot.status === 'running' ? 'pause' : 'start')}
                  >
                    {bot.status === 'running' ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
          ))
        )}
      </div>
    </div>
  );
};