import React, { useState, useEffect } from 'react';
import { X, Bot, TrendingUp, Settings, Zap, Copy, Target, AlertCircle, Loader } from 'lucide-react';
import { supabase, Exchange, BotTemplate, ApiKey } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface CreateBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBotCreated: () => void;
}

interface TradingSymbol {
  id: string;
  symbol: string;
  base_asset: string;
  quote_asset: string;
  account_type: string;
  min_quantity: number;
  price_precision: number;
  quantity_precision: number;
}

export const CreateBotModal: React.FC<CreateBotModalProps> = ({
  isOpen,
  onClose,
  onBotCreated,
}) => {
  const { userProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingSymbols, setLoadingSymbols] = useState(false);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [templates, setTemplates] = useState<BotTemplate[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [tradingSymbols, setTradingSymbols] = useState<TradingSymbol[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<BotTemplate | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    strategy_type: 'grid' as const,
    template_id: '',
    exchange_id: '',
    api_key_id: '',
    account_type: 'spot' as const,
    trading_pair: '',
    base_currency: '',
    quote_currency: '',
    initial_balance: 1000,
    config: {} as any,
  });

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.exchange_id && formData.account_type) {
      fetchTradingSymbols();
    }
  }, [formData.exchange_id, formData.account_type]);

  const fetchData = async () => {
    try {
      // For demo mode, use mock data
      const mockExchanges: Exchange[] = [
        {
          id: '1',
          name: 'binance',
          display_name: 'Binance',
          api_url: 'https://api.binance.com',
          futures_api_url: 'https://fapi.binance.com',
          websocket_url: 'wss://stream.binance.com:9443',
          supports_spot: true,
          supports_futures: true,
          supports_copy_trading: true,
          is_active: true,
          fee_structure: { maker: 0.001, taker: 0.001 },
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'okx',
          display_name: 'OKX',
          api_url: 'https://www.okx.com',
          futures_api_url: 'https://www.okx.com',
          websocket_url: 'wss://ws.okx.com:8443',
          supports_spot: true,
          supports_futures: true,
          supports_copy_trading: true,
          is_active: true,
          fee_structure: { maker: 0.0008, taker: 0.001 },
          created_at: new Date().toISOString()
        }
      ];

      const mockTemplates: BotTemplate[] = [
        {
          id: '1',
          name: 'Grid Trading Bot',
          description: 'Automated grid trading strategy for sideways markets',
          strategy_type: 'grid',
          default_config: { grid_count: 10, price_range: 10, investment_per_grid: 100 },
          min_balance: 1000,
          risk_level: 'medium',
          is_premium: false,
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'DCA Bot',
          description: 'Dollar Cost Averaging strategy for long-term accumulation',
          strategy_type: 'dca',
          default_config: { interval: 'daily', amount: 100, max_orders: 10 },
          min_balance: 500,
          risk_level: 'low',
          is_premium: false,
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Signal Bot',
          description: 'Execute trades based on TradingView signals',
          strategy_type: 'signal',
          default_config: { max_position_size: 1000, risk_per_trade: 2 },
          min_balance: 1000,
          risk_level: 'high',
          is_premium: true,
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: '4',
          name: 'Copy Trading Bot',
          description: 'Copy trades from successful lead traders',
          strategy_type: 'copy_trading',
          default_config: { copy_ratio: 1.0, max_drawdown: 20 },
          min_balance: 2000,
          risk_level: 'medium',
          is_premium: true,
          is_active: true,
          created_at: new Date().toISOString()
        }
      ];

      const mockApiKeys: ApiKey[] = [
        {
          id: '1',
          user_id: userProfile?.id || 'demo',
          exchange_id: '1',
          name: 'Binance Spot Account',
          encrypted_api_key: 'encrypted_key_1',
          encrypted_api_secret: 'encrypted_secret_1',
          permissions: ['read', 'trade'],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          exchange: mockExchanges[0]
        },
        {
          id: '2',
          user_id: userProfile?.id || 'demo',
          exchange_id: '1',
          name: 'Binance Futures Account',
          encrypted_api_key: 'encrypted_key_2',
          encrypted_api_secret: 'encrypted_secret_2',
          permissions: ['read', 'trade', 'futures'],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          exchange: mockExchanges[0]
        },
        {
          id: '3',
          user_id: userProfile?.id || 'demo',
          exchange_id: '2',
          name: 'OKX Spot Account',
          encrypted_api_key: 'encrypted_key_3',
          encrypted_api_secret: 'encrypted_secret_3',
          permissions: ['read', 'trade'],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          exchange: mockExchanges[1]
        }
      ];

      setExchanges(mockExchanges);
      setTemplates(mockTemplates);
      setApiKeys(mockApiKeys);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchTradingSymbols = async () => {
    if (!formData.exchange_id || !formData.account_type) return;
    
    setLoadingSymbols(true);
    try {
      // Mock trading symbols based on exchange and account type
      const mockSymbols: TradingSymbol[] = [
        {
          id: '1',
          symbol: 'BTCUSDT',
          base_asset: 'BTC',
          quote_asset: 'USDT',
          account_type: formData.account_type,
          min_quantity: 0.00001,
          price_precision: 2,
          quantity_precision: 5
        },
        {
          id: '2',
          symbol: 'ETHUSDT',
          base_asset: 'ETH',
          quote_asset: 'USDT',
          account_type: formData.account_type,
          min_quantity: 0.0001,
          price_precision: 2,
          quantity_precision: 4
        },
        {
          id: '3',
          symbol: 'ADAUSDT',
          base_asset: 'ADA',
          quote_asset: 'USDT',
          account_type: formData.account_type,
          min_quantity: 1,
          price_precision: 4,
          quantity_precision: 0
        },
        {
          id: '4',
          symbol: 'SOLUSDT',
          base_asset: 'SOL',
          quote_asset: 'USDT',
          account_type: formData.account_type,
          min_quantity: 0.01,
          price_precision: 2,
          quantity_precision: 2
        }
      ];

      setTradingSymbols(mockSymbols);
    } catch (error) {
      console.error('Error fetching trading symbols:', error);
    } finally {
      setLoadingSymbols(false);
    }
  };

  const handleTemplateSelect = (template: BotTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      ...formData,
      strategy_type: template.strategy_type as any,
      template_id: template.id,
      config: template.default_config,
      initial_balance: template.min_balance || 1000,
      name: `${template.name} #${Date.now().toString().slice(-4)}`,
    });
    setStep(2);
  };

  const handleApiKeyChange = (apiKeyId: string) => {
    const apiKey = apiKeys.find(k => k.id === apiKeyId);
    if (apiKey) {
      setFormData({
        ...formData,
        api_key_id: apiKeyId,
        exchange_id: apiKey.exchange_id,
        account_type: apiKey.account_type as any,
        trading_pair: '', // Reset trading pair when exchange changes
        base_currency: '',
        quote_currency: '',
      });
    }
  };

  const handleTradingPairChange = (symbol: string) => {
    const selectedSymbol = tradingSymbols.find(s => s.symbol === symbol);
    if (selectedSymbol) {
      setFormData({
        ...formData,
        trading_pair: symbol,
        base_currency: selectedSymbol.base_asset,
        quote_currency: selectedSymbol.quote_asset,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // For demo mode, just simulate success
      if (!userProfile?.id) {
        console.log('Demo mode: Bot created successfully');
        onBotCreated();
        onClose();
        resetForm();
        return;
      }

      // Generate webhook URL for signal bots
      let webhookUrl = '';
      if (formData.strategy_type === 'signal') {
        const botId = crypto.randomUUID();
        webhookUrl = `${window.location.origin}/api/webhooks/signal/${botId}`;
      }

      const { error } = await supabase
        .from('trading_bots')
        .insert({
          ...formData,
          user_id: userProfile.id,
          status: 'stopped',
          current_balance: formData.initial_balance,
          webhook_url: webhookUrl,
          webhook_secret: formData.strategy_type === 'signal' ? crypto.randomUUID() : null,
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
    setSelectedTemplate(null);
    setTradingSymbols([]);
    setFormData({
      name: '',
      strategy_type: 'grid',
      template_id: '',
      exchange_id: '',
      api_key_id: '',
      account_type: 'spot',
      trading_pair: '',
      base_currency: '',
      quote_currency: '',
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

  const getAccountTypeLabel = (accountType: string) => {
    switch (accountType) {
      case 'spot': return 'Spot Trading';
      case 'futures': return 'Futures Trading';
      case 'copy_trading': return 'Copy Trading (Lead Trader)';
      default: return accountType;
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
              
              {/* API Keys Warning */}
              {apiKeys.length === 0 && (
                <div className="mb-6 p-4 bg-yellow-600 bg-opacity-20 border border-yellow-600 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-yellow-400" />
                    <span className="text-yellow-400 font-semibold">No API Keys Found</span>
                  </div>
                  <p className="text-yellow-200 text-sm mt-2">
                    You need to add exchange API keys before creating bots. Go to Settings → API Keys to add your exchange credentials.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => apiKeys.length > 0 && handleTemplateSelect(template)}
                    className={`p-6 bg-gray-700 rounded-lg border border-gray-600 transition-all duration-200 ${
                      apiKeys.length > 0 
                        ? 'hover:border-blue-500 cursor-pointer hover:bg-gray-650' 
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg bg-opacity-20 ${getStrategyColor(template.strategy_type)}`}>
                        {getStrategyIcon(template.strategy_type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{template.name}</h4>
                        <p className="text-gray-400 text-sm mt-1">{template.description}</p>
                        
                        {/* Account Types */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {(template.account_types as string[]).map((accountType) => (
                            <span key={accountType} className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded">
                              {getAccountTypeLabel(accountType)}
                            </span>
                          ))}
                        </div>
                        
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
                            {template.is_premium && (
                              <span className="px-2 py-1 rounded text-xs text-purple-400 bg-purple-600 bg-opacity-20">
                                PRO
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

          {step === 2 && selectedTemplate && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="text-xl font-semibold">Configure Your {selectedTemplate.name}</h3>
              
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
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select API Key</option>
                    {apiKeys
                      .filter(apiKey => 
                        (selectedTemplate.account_types as string[]).includes(apiKey.account_type)
                      )
                      .map((apiKey) => (
                        <option key={apiKey.id} value={apiKey.id}>
                          {apiKey.exchange?.display_name} - {apiKey.name} ({getAccountTypeLabel(apiKey.account_type)})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Trading Pair
                  </label>
                  <div className="relative">
                    <select
                      value={formData.trading_pair}
                      onChange={(e) => handleTradingPairChange(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={!formData.exchange_id || loadingSymbols}
                    >
                      <option value="">
                        {loadingSymbols ? 'Loading symbols...' : 'Select Trading Pair'}
                      </option>
                      {tradingSymbols.map((symbol) => (
                        <option key={symbol.id} value={symbol.symbol}>
                          {symbol.symbol} (Min: {symbol.min_quantity} {symbol.base_asset})
                        </option>
                      ))}
                    </select>
                    {loadingSymbols && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader className="w-5 h-5 animate-spin text-blue-400" />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Initial Investment (USDT)
                  </label>
                  <input
                    type="number"
                    value={formData.initial_balance}
                    onChange={(e) => setFormData({ ...formData, initial_balance: parseFloat(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min={selectedTemplate.min_balance || 1}
                    step="0.01"
                    required
                  />
                  {selectedTemplate.min_balance && (
                    <p className="text-xs text-gray-400 mt-1">
                      Minimum: ${selectedTemplate.min_balance}
                    </p>
                  )}
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
                      <strong>Webhook Integration:</strong> This bot will receive signals from TradingView or other platforms. 
                      The webhook URL will be generated after creating the bot.
                    </p>
                  </div>
                </div>
              )}

              {formData.strategy_type === 'copy_trading' && (
                <div className="bg-gray-700 rounded-lg p-6">
                  <h4 className="font-semibold mb-4 flex items-center">
                    <Copy className="w-5 h-5 mr-2" />
                    Copy Trading Settings
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Lead Trader ID
                      </label>
                      <input
                        type="text"
                        placeholder="Enter lead trader profile ID"
                        onChange={(e) => setFormData({
                          ...formData,
                          config: { ...formData.config, lead_trader_id: e.target.value }
                        })}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Copy Ratio
                      </label>
                      <input
                        type="number"
                        defaultValue={formData.config.copy_ratio || 1.0}
                        onChange={(e) => setFormData({
                          ...formData,
                          config: { ...formData.config, copy_ratio: parseFloat(e.target.value) }
                        })}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="0.1"
                        max="10"
                        step="0.1"
                      />
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-purple-600 bg-opacity-20 border border-purple-600 rounded-lg">
                    <p className="text-purple-400 text-sm">
                      <strong>Copy Trading:</strong> This bot will automatically copy trades from successful lead traders. 
                      Make sure you have the correct lead trader profile ID.
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
                  disabled={loading || !formData.trading_pair}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors flex items-center space-x-2"
                >
                  {loading && <Loader className="w-4 h-4 animate-spin" />}
                  <span>{loading ? 'Creating Bot...' : 'Create Bot'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};