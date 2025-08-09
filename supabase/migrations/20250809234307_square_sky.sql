/*
  # Complete Crypto Trading Platform Schema

  1. New Tables
    - `users` - User profiles and subscription info
    - `user_profiles` - Extended user profile data
    - `exchanges` - Supported cryptocurrency exchanges
    - `api_keys` - User exchange API keys (encrypted)
    - `trading_bots` - Trading bot configurations
    - `bot_templates` - Pre-configured bot templates
    - `bot_signals` - Webhook signals for signal bots
    - `trades` - Trading history and transactions
    - `subscriptions` - User subscription management
    - `referrals` - Referral program tracking
    - `admin_users` - Admin user management
    - `notifications` - User notifications
    - `audit_logs` - System audit logging

  2. Security
    - Enable RLS on all tables
    - Add policies for user data access
    - Admin-only access for management tables

  3. Functions
    - Updated timestamp triggers
    - Referral code generation
*/

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Users table (extends auth.users)
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

-- User profiles for extended information
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE,
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

-- Bot templates
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

-- Bot signals for webhook trading
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

-- Insert default exchanges
INSERT INTO exchanges (name, display_name, api_url, futures_api_url, supports_spot, supports_futures, supports_copy_trading) VALUES
  ('binance', 'Binance', 'https://api.binance.com', 'https://fapi.binance.com', true, true, true),
  ('okx', 'OKX', 'https://www.okx.com', 'https://www.okx.com', true, true, true),
  ('bybit', 'Bybit', 'https://api.bybit.com', 'https://api.bybit.com', true, true, false),
  ('kucoin', 'KuCoin', 'https://api.kucoin.com', 'https://api-futures.kucoin.com', true, true, false)
ON CONFLICT (name) DO NOTHING;

-- Insert default bot templates
INSERT INTO bot_templates (name, description, strategy_type, default_config, min_balance, risk_level) VALUES
  ('Basic Grid Bot', 'Simple grid trading strategy for stable profits', 'grid', '{"grid_count": 10, "price_range": 10, "investment_per_grid": 100}', 1000, 'low'),
  ('DCA Bot', 'Dollar-cost averaging for long-term accumulation', 'dca', '{"buy_interval": 3600, "buy_amount": 50, "max_orders": 20}', 500, 'low'),
  ('Signal Bot', 'Execute trades based on webhook signals', 'signal', '{"max_position_size": 1000, "risk_per_trade": 2}', 100, 'medium'),
  ('Copy Trading Bot', 'Copy trades from successful traders', 'copy_trading', '{"copy_ratio": 1.0, "max_position_size": 5000}', 1000, 'medium'),
  ('Scalping Bot', 'High-frequency trading for quick profits', 'scalping', '{"profit_target": 0.5, "stop_loss": 0.3, "max_trades_per_hour": 10}', 2000, 'high')
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can read own data" ON users FOR SELECT TO authenticated USING (auth_id = auth.uid());
CREATE POLICY "Users can update own data" ON users FOR UPDATE TO authenticated USING (auth_id = auth.uid());

-- Admin policies for users
CREATE POLICY "Admins can read all data" ON users FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM admin_users au 
    JOIN users u ON au.user_id = u.id 
    WHERE u.auth_id = auth.uid() AND au.is_active = true
  )
);

CREATE POLICY "Admins can manage all data" ON users FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM admin_users au 
    JOIN users u ON au.user_id = u.id 
    WHERE u.auth_id = auth.uid() AND au.is_active = true
  )
);

-- User profiles policies
CREATE POLICY "Users can manage own profile" ON user_profiles FOR ALL TO authenticated USING (
  user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
);

-- Exchanges policies (read-only for users)
CREATE POLICY "Users can read exchanges" ON exchanges FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admins can manage exchanges" ON exchanges FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) 
    AND is_active = true
  )
);

-- API keys policies
CREATE POLICY "Users can manage own API keys" ON api_keys FOR ALL TO authenticated USING (
  user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
);

-- Trading bots policies
CREATE POLICY "Users can manage own bots" ON trading_bots FOR ALL TO authenticated USING (
  user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
);

-- Bot templates policies
CREATE POLICY "Users can read bot templates" ON bot_templates FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admins can manage bot templates" ON bot_templates FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) 
    AND is_active = true
  )
);

-- Bot signals policies
CREATE POLICY "Bot signals accessible by bot owner" ON bot_signals FOR ALL TO authenticated USING (
  bot_id IN (
    SELECT id FROM trading_bots 
    WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  )
);

-- Trades policies
CREATE POLICY "Users can view own trades" ON trades FOR SELECT TO authenticated USING (
  user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
);

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT TO authenticated USING (
  user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
);

-- Referrals policies
CREATE POLICY "Users can view own referrals" ON referrals FOR SELECT TO authenticated USING (
  referrer_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) OR
  referred_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
);

-- Notifications policies
CREATE POLICY "Users can manage own notifications" ON notifications FOR ALL TO authenticated USING (
  user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
);

-- Admin policies
CREATE POLICY "Admins can manage audit logs" ON audit_logs FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) 
    AND is_active = true
  )
);

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trading_bots_updated_at BEFORE UPDATE ON trading_bots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate referral codes
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text AS $$
DECLARE
  code text;
  exists boolean;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM users WHERE referral_code = code) INTO exists;
    IF NOT exists THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate referral codes
CREATE OR REPLACE FUNCTION auto_generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_referral_code BEFORE INSERT ON users FOR EACH ROW EXECUTE FUNCTION auto_generate_referral_code();