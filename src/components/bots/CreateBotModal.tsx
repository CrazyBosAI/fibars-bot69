import React, { useState, useEffect } from 'react';
import { X, Bot, TrendingUp, Settings, Zap, Copy, Target } from 'lucide-react';
import { supabase, Exchange, BotTemplate, ApiKey } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface CreateBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBotCreated: () => void;
}

export const CreateBotModal: React.FC<CreateBotModalProps> = ({
  isOpen,
  onClose,
  onBotCreated,
}) => {
  const { userProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [templates, setTemplates] = useState<BotTemplate[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    strategy_type: 'grid' as const,
    template_id: '',
    exchange_id: '',
    api_key_id: '',
    trading_pair: 'BTC/USDT',
    base_currency: 'BTC',
    quote_currency: 'USDT',
    initial_balance: 1000,
    config: {} as any,
  });

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      // Fetch exchanges
      const { data: exchangesData } = await supabase
        .from('exchanges')
        .select('*')
        .eq('is_active', true);
      
      // Fetch templates
      const { data: templatesData } = await supabase
        .from('bot_templates')
        .select('*')
        .eq('is_active', true);
      
      // Fetch user's API keys
      const { data: apiKeysData } = await supabase
        .from('api_keys')
        .select('*, exchange:exchanges(*)')
        .eq('user_id', userProfile?.id)
        .eq('is_active', true);

      setExchanges(exchangesData || []);
      setTemplates(templatesData || []);
      setApiKeys(apiKeysData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleTemplateSelect = (template: BotTemplate) => {
    setFormData({
      ...formData,
      strategy_type: template.strategy_type as any,
      template_id: template.id,
      config: template.default_config,
      initial_balance: template.min_balance || 1000,
    });
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('trading_bots')
        .insert({
          ...formData,
          user_id: userProfile?.id,
          status: 'stopped',
          current_balance: formData.initial_balance,
        });

      if (error) throw error;

      onBotCreated();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating bot:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setFormData({
      name: '',
      strategy_type: 'grid',
      template_id: '',
      exchange_id: '',
      api_key_id: '',
      trading_pair: 'BTC/USDT',
      base_currency: 'BTC',
      quote_currency: 'USDT',
      initial_balance: 1000,
      config: {},
    });
  };

  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case 'grid': return <TrendingUp className="w-6 h-6" />;
      case 'dca': return <Target className="w-6 h-6" />;
      case 'signal': return <Zap className="w-6 h-6" />;
      case 'copy_trading': return <Copy className="w-6 h-6" />;
      default: return <Bot className="w-6 h-6" />;
    }
  };

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'grid': return 'text-blue-400 bg-blue-600';
      case 'dca': return 'text-green-400 bg-green-600';
      case 'signal': return 'text-yellow-400 bg-yellow-600';
      case 'copy_trading': return 'text-purple-400 bg-purple-600';
      default: return 'text-gray-400 bg-gray-600';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center">
              <Bot className="w-6 h-6 mr-2 text-blue-400" />
              Create Trading Bot
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center mt-6 space-x-4">
            <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-blue-400' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600' : 'bg-gray-600'}`}>
                1
              </div>
              <span>Choose Strategy</span>
            </div>
            <div className={`w-8 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-600'}`}></div>
            <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-blue-400' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600' : 'bg-gray-600'}`}>
                2
              </div>
              <span>Configure Bot</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div>
              <h3 className="text-xl font-semibold mb-6">Choose a Bot Strategy</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className="p-6 bg-gray-700 rounded-lg border border-gray-600 hover:border-blue-500 cursor-pointer transition-all duration-200 hover:bg-gray-650"
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg bg-opacity-20 ${getStrategyColor(template.strategy_type)}`}>
                        {getStrategyIcon(template.strategy_type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{template.name}</h4>
                        <p className="text-gray-400 text-sm mt-1">{template.description}</p>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center space-x-4 text-sm">
                            <span className={`px-2 py-1 rounded text-xs ${getStrategyColor(template.strategy_type)} bg-opacity-20`}>
                              {template.strategy_type.toUpperCase()}
                            </span>
                            {template.risk_level && (
                              <span className={`px-2 py-1 rounded text-xs ${
                                template.risk_level === 'low' ? 'text-green-400 bg-green-600' :
                                template.risk_level === 'medium' ? 'text-yellow-400 bg-yellow-600' :
                                'text-red-400 bg-red-600'
                              } bg-opacity-20`}>
                                {template.risk_level} risk
                              </span>
                            )}
                          </div>
                          {template.min_balance && (
                            <span className="text-sm text-gray-400">
                              Min: ${template.min_balance}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="text-xl font-semibold">Configure Your Bot</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bot Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="My Trading Bot"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Exchange & API Key
                  </label>
                  <select
                    value={formData.api_key_id}
                    onChange={(e) => {
                      const apiKey = apiKeys.find(k => k.id === e.target.value);
                      setFormData({
                        ...formData,
                        api_key_id: e.target.value,
                        exchange_id: apiKey?.exchange_id || '',
                      });
                    }}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select API Key</option>
                    {apiKeys.map((apiKey) => (
                      <option key={apiKey.id} value={apiKey.id}>
                        {apiKey.exchange?.display_name} - {apiKey.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Trading Pair
                  </label>
                  <input
                    type="text"
                    value={formData.trading_pair}
                    onChange={(e) => {
                      const pair = e.target.value;
                      const [base, quote] = pair.split('/');
                      setFormData({
                        ...formData,
                        trading_pair: pair,
                        base_currency: base || '',
                        quote_currency: quote || '',
                      });
                    }}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="BTC/USDT"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Initial Balance (USDT)
                  </label>
                  <input
                    type="number"
                    value={formData.initial_balance}
                    onChange={(e) => setFormData({ ...formData, initial_balance: parseFloat(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="1"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              {/* Strategy-specific configuration */}
              {formData.strategy_type === 'grid' && (
                <div className="bg-gray-700 rounded-lg p-6">
                  <h4 className="font-semibold mb-4 flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Grid Strategy Settings
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Grid Count
                      </label>
                      <input
                        type="number"
                        defaultValue={formData.config.grid_count || 10}
                        onChange={(e) => setFormData({
                          ...formData,
                          config: { ...formData.config, grid_count: parseInt(e.target.value) }
                        })}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="5"
                        max="50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Price Range (%)
                      </label>
                      <input
                        type="number"
                        defaultValue={formData.config.price_range || 10}
                        onChange={(e) => setFormData({
                          ...formData,
                          config: { ...formData.config, price_range: parseFloat(e.target.value) }
                        })}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="1"
                        max="50"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Investment per Grid
                      </label>
                      <input
                        type="number"
                        defaultValue={formData.config.investment_per_grid || 100}
                        onChange={(e) => setFormData({
                          ...formData,
                          config: { ...formData.config, investment_per_grid: parseFloat(e.target.value) }
                        })}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="10"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.strategy_type === 'signal' && (
                <div className="bg-gray-700 rounded-lg p-6">
                  <h4 className="font-semibold mb-4 flex items-center">
                    <Zap className="w-5 h-5 mr-2" />
                    Signal Bot Settings
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Max Position Size (USDT)
                      </label>
                      <input
                        type="number"
                        defaultValue={formData.config.max_position_size || 1000}
                        onChange={(e) => setFormData({
                          ...formData,
                          config: { ...formData.config, max_position_size: parseFloat(e.target.value) }
                        })}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="10"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Risk per Trade (%)
                      </label>
                      <input
                        type="number"
                        defaultValue={formData.config.risk_per_trade || 2}
                        onChange={(e) => setFormData({
                          ...formData,
                          config: { ...formData.config, risk_per_trade: parseFloat(e.target.value) }
                        })}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="0.1"
                        max="10"
                        step="0.1"
                      />
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-blue-600 bg-opacity-20 border border-blue-600 rounded-lg">
                    <p className="text-blue-400 text-sm">
                      <strong>Webhook URL:</strong> This will be generated after creating the bot. 
                      Use this URL to send trading signals to your bot.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-6 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
                >
                  {loading ? 'Creating Bot...' : 'Create Bot'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};