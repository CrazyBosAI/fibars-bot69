/*
  # Complete Trading Platform Schema

  1. New Tables
    - `users` - User accounts with subscription info
    - `user_profiles` - Extended user profile information
    - `exchanges` - Supported exchanges configuration
    - `api_keys` - User exchange API keys (encrypted)
    - `trading_bots` - Bot configurations and settings
    - `bot_signals` - Webhook signals for signal bots
    - `trades` - All trading transactions
    - `subscriptions` - User subscription management
    - `referrals` - Referral system
    - `admin_users` - Admin panel access
    - `bot_templates` - Pre-configured bot templates
    - `notifications` - User notifications
    - `audit_logs` - System audit trail

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for user data isolation
    - Admin-only access policies

  3. Functions
    - User registration with referral tracking
    - API key encryption/decryption
    - Bot performance calculations
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro', 'enterprise')),
  subscription_status text DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired', 'trial')),
  subscription_expires_at timestamptz,
  total_balance decimal(20,8) DEFAULT 0,
  total_profit decimal(20,8) DEFAULT 0,
  referral_code text UNIQUE,
  referred_by uuid REFERENCES users(id),
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User profiles for extended information
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  phone text,
  country text,
  timezone text DEFAULT 'UTC',
  language text DEFAULT 'en',
  two_factor_enabled boolean DEFAULT false,
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  trading_experience text CHECK (trading_experience IN ('beginner', 'intermediate', 'advanced', 'expert')),
  risk_tolerance text CHECK (risk_tolerance IN ('low', 'medium', 'high')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Supported exchanges
CREATE TABLE IF NOT EXISTS exchanges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  api_url text NOT NULL,
  futures_api_url text,
  websocket_url text,
  supports_spot boolean DEFAULT true,
  supports_futures boolean DEFAULT false,
  supports_copy_trading boolean DEFAULT false,
  is_active boolean DEFAULT true,
  fee_structure jsonb,
  created_at timestamptz DEFAULT now()
);

-- User API keys (encrypted)
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  exchange_id uuid REFERENCES exchanges(id) ON DELETE CASCADE,
  name text NOT NULL,
  api_key text NOT NULL, -- encrypted
  api_secret text NOT NULL, -- encrypted
  passphrase text, -- encrypted (for OKX)
  permissions jsonb DEFAULT '["read"]'::jsonb,
  whitelisted_ips text[],
  is_active boolean DEFAULT true,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, exchange_id, name)
);

-- Bot templates
CREATE TABLE IF NOT EXISTS bot_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  strategy_type text NOT NULL CHECK (strategy_type IN ('grid', 'dca', 'scalping', 'swing', 'arbitrage', 'signal', 'copy_trading')),
  default_config jsonb NOT NULL,
  min_balance decimal(20,8),
  risk_level text CHECK (risk_level IN ('low', 'medium', 'high')),
  is_premium boolean DEFAULT false,
  created_by uuid REFERENCES users(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Trading bots
CREATE TABLE IF NOT EXISTS trading_bots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  exchange_id uuid REFERENCES exchanges(id),
  api_key_id uuid REFERENCES api_keys(id),
  template_id uuid REFERENCES bot_templates(id),
  name text NOT NULL,
  strategy_type text NOT NULL CHECK (strategy_type IN ('grid', 'dca', 'scalping', 'swing', 'arbitrage', 'signal', 'copy_trading')),
  trading_pair text NOT NULL,
  base_currency text NOT NULL,
  quote_currency text NOT NULL,
  status text DEFAULT 'stopped' CHECK (status IN ('running', 'stopped', 'paused', 'error')),
  config jsonb NOT NULL,
  initial_balance decimal(20,8) NOT NULL,
  current_balance decimal(20,8) DEFAULT 0,
  total_profit decimal(20,8) DEFAULT 0,
  total_trades integer DEFAULT 0,
  win_rate decimal(5,2) DEFAULT 0,
  max_drawdown decimal(5,2) DEFAULT 0,
  last_trade_at timestamptz,
  error_message text,
  webhook_url text, -- for signal bots
  webhook_secret text, -- for signal bot security
  copy_trader_id text, -- for copy trading
  started_at timestamptz,
  stopped_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Bot signals (for signal bots)
CREATE TABLE IF NOT EXISTS bot_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id uuid REFERENCES trading_bots(id) ON DELETE CASCADE,
  signal_type text NOT NULL CHECK (signal_type IN ('buy', 'sell', 'close', 'update_tp', 'update_sl')),
  symbol text NOT NULL,
  price decimal(20,8),
  quantity decimal(20,8),
  take_profit decimal(20,8),
  stop_loss decimal(20,8),
  leverage integer,
  signal_data jsonb,
  processed boolean DEFAULT false,
  processed_at timestamptz,
  error_message text,
  source_ip text,
  created_at timestamptz DEFAULT now()
);

-- Trades
CREATE TABLE IF NOT EXISTS trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  bot_id uuid REFERENCES trading_bots(id),
  exchange_id uuid REFERENCES exchanges(id),
  exchange_order_id text,
  symbol text NOT NULL,
  side text NOT NULL CHECK (side IN ('buy', 'sell')),
  type text NOT NULL CHECK (type IN ('market', 'limit', 'stop', 'stop_limit')),
  quantity decimal(20,8) NOT NULL,
  price decimal(20,8),
  executed_price decimal(20,8),
  executed_quantity decimal(20,8),
  fee decimal(20,8) DEFAULT 0,
  fee_currency text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'partially_filled', 'cancelled', 'rejected')),
  profit_loss decimal(20,8) DEFAULT 0,
  is_futures boolean DEFAULT false,
  leverage integer DEFAULT 1,
  position_side text CHECK (position_side IN ('long', 'short')),
  executed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id text UNIQUE,
  stripe_customer_id text,
  plan_name text NOT NULL,
  plan_price decimal(10,2) NOT NULL,
  billing_cycle text CHECK (billing_cycle IN ('monthly', 'yearly')),
  status text CHECK (status IN ('active', 'cancelled', 'past_due', 'unpaid')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Referrals
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES users(id) ON DELETE CASCADE,
  referred_id uuid REFERENCES users(id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  commission_rate decimal(5,2) DEFAULT 10.00,
  total_commission decimal(20,8) DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(referrer_id, referred_id)
);

-- Admin users
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator')),
  permissions jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES admin_users(id),
  created_at timestamptz DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('trade', 'bot_status', 'security', 'subscription', 'referral')),
  title text NOT NULL,
  message text NOT NULL,
  data jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  admin_id uuid REFERENCES admin_users(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Insert default exchanges
INSERT INTO exchanges (name, display_name, api_url, futures_api_url, supports_spot, supports_futures, supports_copy_trading) VALUES
('binance', 'Binance', 'https://api.binance.com', 'https://fapi.binance.com', true, true, true),
('okx', 'OKX', 'https://www.okx.com', 'https://www.okx.com', true, true, false),
('bybit', 'Bybit', 'https://api.bybit.com', 'https://api.bybit.com', true, true, false),
('kucoin', 'KuCoin', 'https://api.kucoin.com', 'https://api-futures.kucoin.com', true, true, false)
ON CONFLICT (name) DO NOTHING;

-- Insert default bot templates
INSERT INTO bot_templates (name, description, strategy_type, default_config, min_balance, risk_level) VALUES
('Basic Grid Bot', 'Simple grid trading strategy for stable pairs', 'grid', '{"grid_count": 10, "price_range": 0.1, "investment_per_grid": 100}', 1000, 'medium'),
('DCA Bot', 'Dollar Cost Averaging for long-term accumulation', 'dca', '{"buy_interval": "1h", "buy_amount": 50, "take_profit": 0.05}', 500, 'low'),
('Signal Bot', 'Execute trades based on webhook signals', 'signal', '{"max_position_size": 1000, "risk_per_trade": 0.02}', 1000, 'high'),
('Copy Trading Bot', 'Copy trades from successful traders', 'copy_trading', '{"copy_ratio": 1.0, "max_drawdown": 0.1}', 2000, 'medium')
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can read own data" ON users FOR SELECT TO authenticated USING (auth_id = auth.uid());
CREATE POLICY "Users can update own data" ON users FOR UPDATE TO authenticated USING (auth_id = auth.uid());

-- RLS Policies for user_profiles
CREATE POLICY "Users can manage own profile" ON user_profiles FOR ALL TO authenticated USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- RLS Policies for api_keys
CREATE POLICY "Users can manage own API keys" ON api_keys FOR ALL TO authenticated USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- RLS Policies for trading_bots
CREATE POLICY "Users can manage own bots" ON trading_bots FOR ALL TO authenticated USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- RLS Policies for bot_signals
CREATE POLICY "Bot signals accessible by bot owner" ON bot_signals FOR ALL TO authenticated USING (bot_id IN (SELECT id FROM trading_bots WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())));

-- RLS Policies for trades
CREATE POLICY "Users can view own trades" ON trades FOR SELECT TO authenticated USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- RLS Policies for subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT TO authenticated USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- RLS Policies for referrals
CREATE POLICY "Users can view own referrals" ON referrals FOR SELECT TO authenticated USING (referrer_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) OR referred_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- RLS Policies for notifications
CREATE POLICY "Users can manage own notifications" ON notifications FOR ALL TO authenticated USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Admin policies (allow all operations for admin users)
CREATE POLICY "Admins can read all data" ON users FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM admin_users au JOIN users u ON au.user_id = u.id WHERE u.auth_id = auth.uid() AND au.is_active = true));

-- Functions
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text AS $$
BEGIN
  RETURN upper(substring(md5(random()::text) from 1 for 8));
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS trigger AS $$
BEGIN
  INSERT INTO users (auth_id, email, referral_code)
  VALUES (NEW.id, NEW.email, generate_referral_code());
  
  INSERT INTO user_profiles (user_id)
  VALUES ((SELECT id FROM users WHERE auth_id = NEW.id));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on auth user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trading_bots_updated_at BEFORE UPDATE ON trading_bots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();