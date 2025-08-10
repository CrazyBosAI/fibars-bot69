/*
  # Complete CryptoTrader Pro Database Schema
  
  1. New Tables
    - `users` - User accounts and profiles
    - `user_profiles` - Extended user profile information
    - `exchanges` - Supported cryptocurrency exchanges
    - `api_keys` - User API keys for exchanges (encrypted)
    - `trading_bots` - Trading bot configurations
    - `bot_templates` - Pre-configured bot templates
    - `bot_signals` - Trading signals for signal bots
    - `trades` - Trading history and transactions
    - `subscriptions` - User subscription management
    - `referrals` - Referral program tracking
    - `notifications` - User notifications
    - `admin_users` - Admin user management
    - `audit_logs` - System audit logging

  2. Security
    - Enable RLS on all tables
    - Add comprehensive access policies
    - Separate admin and user access controls

  3. Features
    - Multi-exchange support
    - Multiple trading strategies
    - Subscription management
    - Referral system
    - Audit logging
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Users table (main user accounts)
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
  total_balance numeric(20,8) DEFAULT 0,
  total_profit numeric(20,8) DEFAULT 0,
  referral_code text UNIQUE,
  referred_by uuid REFERENCES users(id),
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS and create policies for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can read own data" ON users;
  DROP POLICY IF EXISTS "Users can update own data" ON users;
  DROP POLICY IF EXISTS "Admins can read all data" ON users;
  DROP POLICY IF EXISTS "Admins can manage all data" ON users;
END $$;

CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO authenticated
  USING (auth_id = auth.uid());

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE TO authenticated
  USING (auth_id = auth.uid());

-- User profiles table (extended profile information)
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES users(id) ON DELETE CASCADE,
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

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own profile" ON user_profiles;
CREATE POLICY "Users can manage own profile" ON user_profiles
  FOR ALL TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Exchanges table
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

ALTER TABLE exchanges ENABLE ROW LEVEL SECURITY;

-- API Keys table (encrypted storage)
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  exchange_id uuid REFERENCES exchanges(id) ON DELETE CASCADE,
  name text NOT NULL,
  encrypted_api_key bytea NOT NULL,
  encrypted_api_secret bytea NOT NULL,
  encrypted_passphrase bytea,
  permissions jsonb DEFAULT '["read"]',
  whitelisted_ips text[],
  is_active boolean DEFAULT true,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, exchange_id, name)
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own API keys" ON api_keys;
CREATE POLICY "Users can manage own API keys" ON api_keys
  FOR ALL TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Bot templates table
CREATE TABLE IF NOT EXISTS bot_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  strategy_type text NOT NULL CHECK (strategy_type IN ('grid', 'dca', 'scalping', 'swing', 'arbitrage', 'signal', 'copy_trading')),
  default_config jsonb NOT NULL,
  min_balance numeric(20,8),
  risk_level text CHECK (risk_level IN ('low', 'medium', 'high')),
  is_premium boolean DEFAULT false,
  created_by uuid REFERENCES users(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bot_templates ENABLE ROW LEVEL SECURITY;

-- Trading bots table
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
  initial_balance numeric(20,8) NOT NULL,
  current_balance numeric(20,8) DEFAULT 0,
  total_profit numeric(20,8) DEFAULT 0,
  total_trades integer DEFAULT 0,
  win_rate numeric(5,2) DEFAULT 0,
  max_drawdown numeric(5,2) DEFAULT 0,
  last_trade_at timestamptz,
  error_message text,
  webhook_url text,
  webhook_secret text,
  copy_trader_id text,
  started_at timestamptz,
  stopped_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name)
);

ALTER TABLE trading_bots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own bots" ON trading_bots;
CREATE POLICY "Users can manage own bots" ON trading_bots
  FOR ALL TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Bot signals table
CREATE TABLE IF NOT EXISTS bot_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id uuid REFERENCES trading_bots(id) ON DELETE CASCADE,
  signal_type text NOT NULL CHECK (signal_type IN ('buy', 'sell', 'close', 'update_tp', 'update_sl')),
  symbol text NOT NULL,
  price numeric(20,8),
  quantity numeric(20,8),
  take_profit numeric(20,8),
  stop_loss numeric(20,8),
  leverage integer,
  signal_data jsonb,
  processed boolean DEFAULT false,
  processed_at timestamptz,
  error_message text,
  source_ip text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bot_signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Bot signals accessible by bot owner" ON bot_signals;
CREATE POLICY "Bot signals accessible by bot owner" ON bot_signals
  FOR ALL TO authenticated
  USING (bot_id IN (SELECT id FROM trading_bots WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())));

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  bot_id uuid REFERENCES trading_bots(id),
  exchange_id uuid REFERENCES exchanges(id),
  exchange_order_id text,
  symbol text NOT NULL,
  side text NOT NULL CHECK (side IN ('buy', 'sell')),
  type text NOT NULL CHECK (type IN ('market', 'limit', 'stop', 'stop_limit')),
  quantity numeric(20,8) NOT NULL,
  price numeric(20,8),
  executed_price numeric(20,8),
  executed_quantity numeric(20,8),
  fee numeric(20,8) DEFAULT 0,
  fee_currency text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'partially_filled', 'cancelled', 'rejected')),
  profit_loss numeric(20,8) DEFAULT 0,
  is_futures boolean DEFAULT false,
  leverage integer DEFAULT 1,
  position_side text CHECK (position_side IN ('long', 'short')),
  executed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own trades" ON trades;
CREATE POLICY "Users can view own trades" ON trades
  FOR SELECT TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id text UNIQUE,
  stripe_customer_id text,
  plan_name text NOT NULL,
  plan_price numeric(10,2) NOT NULL,
  billing_cycle text CHECK (billing_cycle IN ('monthly', 'yearly')),
  status text CHECK (status IN ('active', 'cancelled', 'past_due', 'unpaid')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES users(id) ON DELETE CASCADE,
  referred_id uuid REFERENCES users(id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  commission_rate numeric(5,2) DEFAULT 10.00,
  total_commission numeric(20,8) DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(referrer_id, referred_id)
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own referrals" ON referrals;
CREATE POLICY "Users can view own referrals" ON referrals
  FOR SELECT TO authenticated
  USING (referrer_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) OR 
         referred_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator')),
  permissions jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES admin_users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Notifications table
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

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own notifications" ON notifications;
CREATE POLICY "Users can manage own notifications" ON notifications
  FOR ALL TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Audit logs table
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

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create admin policies after admin_users table exists
DROP POLICY IF EXISTS "Admins can read all data" ON users;
DROP POLICY IF EXISTS "Admins can manage all data" ON users;

CREATE POLICY "Admins can read all data" ON users
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users au 
    JOIN users u ON au.user_id = u.id 
    WHERE u.auth_id = auth.uid() AND au.is_active = true
  ));

CREATE POLICY "Admins can manage all data" ON users
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users au 
    JOIN users u ON au.user_id = u.id 
    WHERE u.auth_id = auth.uid() AND au.is_active = true
  ));

-- Add similar admin policies for other tables
DROP POLICY IF EXISTS "Admins can manage exchanges" ON exchanges;
CREATE POLICY "Admins can manage exchanges" ON exchanges
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) 
    AND is_active = true
  ));

DROP POLICY IF EXISTS "Admins can manage bot templates" ON bot_templates;
CREATE POLICY "Admins can manage bot templates" ON bot_templates
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) 
    AND is_active = true
  ));

DROP POLICY IF EXISTS "Admins can manage audit logs" ON audit_logs;
CREATE POLICY "Admins can manage audit logs" ON audit_logs
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) 
    AND is_active = true
  ));

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_api_keys_updated_at ON api_keys;
CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trading_bots_updated_at ON trading_bots;
CREATE TRIGGER update_trading_bots_updated_at
  BEFORE UPDATE ON trading_bots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default exchanges
INSERT INTO exchanges (name, display_name, api_url, futures_api_url, supports_spot, supports_futures, supports_copy_trading) VALUES
  ('binance', 'Binance', 'https://api.binance.com', 'https://fapi.binance.com', true, true, false),
  ('okx', 'OKX', 'https://www.okx.com', 'https://www.okx.com', true, true, true),
  ('bybit', 'Bybit', 'https://api.bybit.com', 'https://api.bybit.com', true, true, true),
  ('kucoin', 'KuCoin', 'https://api.kucoin.com', 'https://api-futures.kucoin.com', true, true, false)
ON CONFLICT (name) DO NOTHING;

-- Insert default bot templates
INSERT INTO bot_templates (name, description, strategy_type, default_config, min_balance, risk_level) VALUES
  ('Basic Grid Bot', 'Simple grid trading strategy for stable markets', 'grid', '{"grid_count": 10, "price_range": 10, "investment_per_grid": 100}', 1000, 'medium'),
  ('DCA Bot', 'Dollar-cost averaging for long-term accumulation', 'dca', '{"buy_interval": 3600, "buy_amount": 50, "max_orders": 20}', 500, 'low'),
  ('Signal Bot', 'Execute trades based on external signals', 'signal', '{"max_position_size": 1000, "risk_per_trade": 2}', 100, 'high'),
  ('Copy Trading Bot', 'Copy trades from successful traders', 'copy_trading', '{"copy_ratio": 0.1, "max_drawdown": 10}', 1000, 'medium'),
  ('Scalping Bot', 'High-frequency trading for small profits', 'scalping', '{"profit_target": 0.5, "stop_loss": 0.3, "max_trades_per_hour": 10}', 2000, 'high')
ON CONFLICT (name) DO NOTHING;