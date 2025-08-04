import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// For demo purposes, we'll create a mock client if env vars are missing
const createSupabaseClient = () => {
  if (supabaseUrl === 'https://your-project.supabase.co' || supabaseAnonKey === 'your-anon-key') {
    console.warn('Using demo mode - Supabase not configured');
    // Return a mock client for demo purposes
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: () => Promise.resolve({ error: null }),
        signUp: () => Promise.resolve({ error: null }),
        signOut: () => Promise.resolve(),
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
        insert: () => Promise.resolve({ error: null }),
        update: () => ({ eq: () => Promise.resolve({ error: null }) }),
        delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
      }),
    } as any;
  }
  return createClient(supabaseUrl, supabaseAnonKey);
};

export const supabase = createSupabaseClient();

// Database types
export interface User {
  id: string;
  auth_id: string;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  subscription_tier: 'free' | 'basic' | 'pro' | 'enterprise';
  subscription_status: 'active' | 'cancelled' | 'expired' | 'trial';
  subscription_expires_at?: string;
  total_balance: number;
  total_profit: number;
  referral_code: string;
  referred_by?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Exchange {
  id: string;
  name: string;
  display_name: string;
  api_url: string;
  futures_api_url?: string;
  websocket_url?: string;
  supports_spot: boolean;
  supports_futures: boolean;
  supports_copy_trading: boolean;
  is_active: boolean;
  fee_structure?: any;
  created_at: string;
}

export interface ApiKey {
  id: string;
  user_id: string;
  exchange_id: string;
  name: string;
  api_key: string;
  api_secret: string;
  passphrase?: string;
  permissions: string[];
  whitelisted_ips?: string[];
  is_active: boolean;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
  exchange?: Exchange;
}

export interface TradingBot {
  id: string;
  user_id: string;
  exchange_id: string;
  api_key_id: string;
  template_id?: string;
  name: string;
  strategy_type: 'grid' | 'dca' | 'scalping' | 'swing' | 'arbitrage' | 'signal' | 'copy_trading';
  trading_pair: string;
  base_currency: string;
  quote_currency: string;
  status: 'running' | 'stopped' | 'paused' | 'error';
  config: any;
  initial_balance: number;
  current_balance: number;
  total_profit: number;
  total_trades: number;
  win_rate: number;
  max_drawdown: number;
  last_trade_at?: string;
  error_message?: string;
  webhook_url?: string;
  webhook_secret?: string;
  copy_trader_id?: string;
  started_at?: string;
  stopped_at?: string;
  created_at: string;
  updated_at: string;
  exchange?: Exchange;
  api_key?: ApiKey;
}

export interface BotTemplate {
  id: string;
  name: string;
  description?: string;
  strategy_type: string;
  default_config: any;
  min_balance?: number;
  risk_level?: 'low' | 'medium' | 'high';
  is_premium: boolean;
  created_by?: string;
  is_active: boolean;
  created_at: string;
}

export interface Trade {
  id: string;
  user_id: string;
  bot_id?: string;
  exchange_id: string;
  exchange_order_id?: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  quantity: number;
  price?: number;
  executed_price?: number;
  executed_quantity?: number;
  fee: number;
  fee_currency?: string;
  status: 'pending' | 'filled' | 'partially_filled' | 'cancelled' | 'rejected';
  profit_loss: number;
  is_futures: boolean;
  leverage: number;
  position_side?: 'long' | 'short';
  executed_at?: string;
  created_at: string;
  bot?: TradingBot;
  exchange?: Exchange;
}

export interface BotSignal {
  id: string;
  bot_id: string;
  signal_type: 'buy' | 'sell' | 'close' | 'update_tp' | 'update_sl';
  symbol: string;
  price?: number;
  quantity?: number;
  take_profit?: number;
  stop_loss?: number;
  leverage?: number;
  signal_data?: any;
  processed: boolean;
  processed_at?: string;
  error_message?: string;
  source_ip?: string;
  created_at: string;
}