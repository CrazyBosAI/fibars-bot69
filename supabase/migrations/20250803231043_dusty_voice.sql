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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired', 'trial')),
  subscription_expires_at TIMESTAMPTZ,
  total_balance DECIMAL(20,8) DEFAULT 0,
  total_profit DECIMAL(20,8) DEFAULT 0,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES users(id),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles for extended information
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phone TEXT,
  country TEXT,
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  trading_experience TEXT CHECK (trading_experience IN ('beginner', 'intermediate', 'advanced', 'expert')),
  risk_tolerance TEXT CHECK (risk_tolerance IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);

-- Supported exchanges
CREATE TABLE IF NOT EXISTS exchanges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  api_url TEXT NOT NULL,
  futures_api_url TEXT,
  websocket_url TEXT,
  supports_spot BOOLEAN DEFAULT TRUE,
  supports_futures BOOLEAN DEFAULT FALSE,
  supports_copy_trading BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  fee_structure JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT exchanges_name_key UNIQUE (name)
);

-- User API keys (encrypted)
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  exchange_id UUID REFERENCES exchanges(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  encrypted_api_key BYTEA NOT NULL,
  encrypted_api_secret BYTEA NOT NULL,
  encrypted_passphrase BYTEA,
  permissions JSONB DEFAULT '["read"]'::JSONB,
  whitelisted_ips TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT api_keys_unique_key UNIQUE (user_id, exchange_id, name)
);

-- Bot templates
CREATE TABLE IF NOT EXISTS bot_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  strategy_type TEXT NOT NULL CHECK (strategy_type IN ('grid', 'dca', 'scalping', 'swing', 'arbitrage', 'signal', 'copy_trading')),
  default_config JSONB NOT NULL,
  min_balance DECIMAL(20,8),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  is_premium BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT bot_templates_name_key UNIQUE (name)
);

-- Trading bots
CREATE TABLE IF NOT EXISTS trading_bots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  exchange_id UUID REFERENCES exchanges(id),
  api_key_id UUID REFERENCES api_keys(id),
  template_id UUID REFERENCES bot_templates(id),
  name TEXT NOT NULL,
  strategy_type TEXT NOT NULL CHECK (strategy_type IN ('grid', 'dca', 'scalping', 'swing', 'arbitrage', 'signal', 'copy_trading')),
  trading_pair TEXT NOT NULL,
  base_currency TEXT NOT NULL,
  quote_currency TEXT NOT NULL,
  status TEXT DEFAULT 'stopped' CHECK (status IN ('running', 'stopped', 'paused', 'error')),
  config JSONB NOT NULL,
  initial_balance DECIMAL(20,8) NOT NULL,
  current_balance DECIMAL(20,8) DEFAULT 0,
  total_profit DECIMAL(20,8) DEFAULT 0,
  total_trades INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  max_drawdown DECIMAL(5,2) DEFAULT 0,
  last_trade_at TIMESTAMPTZ,
  error_message TEXT,
  webhook_url TEXT, -- for signal bots
  webhook_secret TEXT, -- for signal bot security
  copy_trader_id TEXT, -- for copy trading
  started_at TIMESTAMPTZ,
  stopped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT trading_bots_name_key UNIQUE (user_id, name)
);

-- Bot signals (for signal bots)
CREATE TABLE IF NOT EXISTS bot_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID REFERENCES trading_bots(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('buy', 'sell', 'close', 'update_tp', 'update_sl')),
  symbol TEXT NOT NULL,
  price DECIMAL(20,8),
  quantity DECIMAL(20,8),
  take_profit DECIMAL(20,8),
  stop_loss DECIMAL(20,8),
  leverage INTEGER,
  signal_data JSONB,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  source_ip TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trades
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bot_id UUID REFERENCES trading_bots(id),
  exchange_id UUID REFERENCES exchanges(id),
  exchange_order_id TEXT,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  type TEXT NOT NULL CHECK (type IN ('market', 'limit', 'stop', 'stop_limit')),
  quantity DECIMAL(20,8) NOT NULL,
  price DECIMAL(20,8),
  executed_price DECIMAL(20,8),
  executed_quantity DECIMAL(20,8),
  fee DECIMAL(20,8) DEFAULT 0,
  fee_currency TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'partially_filled', 'cancelled', 'rejected')),
  profit_loss DECIMAL(20,8) DEFAULT 0,
  is_futures BOOLEAN DEFAULT FALSE,
  leverage INTEGER DEFAULT 1,
  position_side TEXT CHECK (position_side IN ('long', 'short')),
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  plan_name TEXT NOT NULL,
  plan_price DECIMAL(10,2) NOT NULL,
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
  status TEXT CHECK (status IN ('active', 'cancelled', 'past_due', 'unpaid')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referrals
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  commission_rate DECIMAL(5,2) DEFAULT 10.00,
  total_commission DECIMAL(20,8) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT referrals_unique_key UNIQUE (referrer_id, referred_id)
);

-- Admin users
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator')),
  permissions JSONB DEFAULT '[]'::JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('trade', 'bot_status', 'security', 'subscription', 'referral')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  admin_id UUID REFERENCES admin_users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default exchanges
INSERT INTO exchanges (name, display_name, api_url, futures_api_url, supports_spot, supports_futures, supports_copy_trading)
VALUES
('binance', 'Binance', 'https://api.binance.com', 'https://fapi.binance.com', TRUE, TRUE, TRUE),
('okx', 'OKX', 'https://www.okx.com', NULL, TRUE, TRUE, FALSE),
('bybit', 'Bybit', 'https://api.bybit.com', NULL, TRUE, TRUE, FALSE),
('kucoin', 'KuCoin', 'https://api.kucoin.com', 'https://api-futures.kucoin.com', TRUE, TRUE, FALSE)
ON CONFLICT ON CONSTRAINT exchanges_name_key DO NOTHING;

-- Insert default bot templates
INSERT INTO bot_templates (name, description, strategy_type, default_config, min_balance, risk_level)
VALUES
('Basic Grid Bot', 'Simple grid trading strategy for stable pairs', 'grid', '{"grid_count": 10, "price_range": 0.1, "investment_per_grid": 100}', 1000, 'medium'),
('DCA Bot', 'Dollar Cost Averaging for long-term accumulation', 'dca', '{"buy_interval": "1h", "buy_amount": 50, "take_profit": 0.05}', 500, 'low'),
('Signal Bot', 'Execute trades based on webhook signals', 'signal', '{"max_position_size": 1000, "risk_per_trade": 0.02}', 1000, 'high'),
('Copy Trading Bot', 'Copy trades from successful traders', 'copy_trading', '{"copy_ratio": 1.0, "max_drawdown": 0.1}', 2000, 'medium')
ON CONFLICT ON CONSTRAINT bot_templates_name_key DO NOTHING;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for User Data Isolation
CREATE POLICY "Users can read own data" ON users FOR SELECT TO authenticated USING (auth_id = auth.uid());
CREATE POLICY "Users can update own data" ON users FOR UPDATE TO authenticated USING (auth_id = auth.uid());

CREATE POLICY "Users can manage own profile" ON user_profiles FOR ALL TO authenticated USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can manage own API keys" ON api_keys FOR ALL TO authenticated USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can manage own bots" ON trading_bots FOR ALL TO authenticated USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Bot signals accessible by bot owner" ON bot_signals FOR ALL TO authenticated USING (bot_id IN (SELECT id FROM trading_bots WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())));

CREATE POLICY "Users can view own trades" ON trades FOR SELECT TO authenticated USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT TO authenticated USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can view own referrals" ON referrals FOR SELECT TO authenticated USING (referrer_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) OR referred_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can manage own notifications" ON notifications FOR ALL TO authenticated USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Admin-only access policies
CREATE POLICY "Admins can read all data" ON users FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM admin_users au JOIN users u ON au.user_id = u.id WHERE u.auth_id = auth.uid() AND au.is_active = TRUE));
CREATE POLICY "Admins can manage all data" ON users FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admin_users au JOIN users u ON au.user_id = u.id WHERE u.auth_id = auth.uid() AND au.is_active = TRUE));

CREATE POLICY "Admins can manage exchanges" ON exchanges FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) AND is_active = TRUE));
CREATE POLICY "Admins can manage bot templates" ON bot_templates FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) AND is_active = TRUE));
CREATE POLICY "Admins can manage audit logs" ON audit_logs FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) AND is_active = TRUE));

-- Functions

-- Generate referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
BEGIN
  RETURN upper(substring(md5(random()::TEXT) FROM 1 FOR 8));
END;
$$ LANGUAGE plpgsql;

-- User registration with referral tracking
CREATE OR REPLACE FUNCTION register_user(
  auth_id UUID,
  email TEXT,
  referral_code TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
  referrer_id UUID;
BEGIN
  -- Insert new user
  INSERT INTO users (auth_id, email, referral_code)
  VALUES (auth_id, email, generate_referral_code())
  RETURNING id INTO new_user_id;

  -- Link to referrer if referral code exists
  IF referral_code IS NOT NULL THEN
    SELECT referrer_id INTO referrer_id
    FROM referrals r
    JOIN users u ON r.referrer_id = u.id
    WHERE r.referral_code = register_user.referral_code AND u.is_verified = TRUE;
    IF referrer_id IS NOT NULL THEN
      INSERT INTO referrals (referrer_id, referred_id, referral_code)
      VALUES (referrer_id, new_user_id, referral_code);
    END IF;
  END IF;

  -- Create default profile
  INSERT INTO user_profiles (user_id) VALUES (new_user_id);

  RETURN new_user_id;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Email or referral code already in use';
END;
$$ LANGUAGE plpgsql;

-- API key encryption/decryption
CREATE OR REPLACE FUNCTION encrypt_api_key(
  api_key TEXT,
  api_secret TEXT,
  passphrase TEXT DEFAULT NULL
) RETURNS TABLE (encrypted_api_key BYTEA, encrypted_api_secret BYTEA, encrypted_passphrase BYTEA) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pgp_sym_encrypt(api_key, 'your_encryption_key') AS encrypted_api_key,
    pgp_sym_encrypt(api_secret, 'your_encryption_key') AS encrypted_api_secret,
    CASE WHEN passphrase IS NULL THEN NULL ELSE pgp_sym_encrypt(passphrase, 'your_encryption_key') END AS encrypted_passphrase;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrypt_api_key(
  encrypted_api_key BYTEA,
  encrypted_api_secret BYTEA,
  encrypted_passphrase BYTEA DEFAULT NULL
) RETURNS TABLE (api_key TEXT, api_secret TEXT, passphrase TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pgp_sym_decrypt(encrypted_api_key, 'your_encryption_key')::TEXT AS api_key,
    pgp_sym_decrypt(encrypted_api_secret, 'your_encryption_key')::TEXT AS api_secret,
    CASE WHEN encrypted_passphrase IS NULL THEN NULL ELSE pgp_sym_decrypt(encrypted_passphrase, 'your_encryption_key')::TEXT END AS passphrase;
END;
$$ LANGUAGE plpgsql;

-- Bot performance calculations
CREATE OR REPLACE FUNCTION calculate_bot_performance(bot_id UUID) RETURNS TABLE (
  total_profit DECIMAL,
  total_trades INTEGER,
  win_rate DECIMAL,
  max_drawdown DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH trade_stats AS (
    SELECT
      COALESCE(SUM(profit_loss), 0) AS total_profit,
      COUNT(*) AS total_trades,
      COUNT(CASE WHEN profit_loss > 0 THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) AS win_rate,
      COALESCE(MAX(peak - trough), 0) AS max_drawdown
    FROM (
      SELECT
        price AS trough,
        MAX(price) OVER (ORDER BY executed_at) AS peak,
        profit_loss
      FROM trades
      WHERE bot_id = calculate_bot_performance.bot_id
    ) t
  )
  UPDATE trading_bots
  SET
    total_profit = trade_stats.total_profit,
    total_trades = trade_stats.total_trades,
    win_rate = trade_stats.win_rate,
    max_drawdown = trade_stats.max_drawdown,
    updated_at = NOW()
  FROM trade_stats
  WHERE trading_bots.id = calculate_bot_performance.bot_id
  RETURNING
    trade_stats.total_profit,
    trade_stats.total_trades,
    trade_stats.win_rate,
    trade_stats.max_drawdown;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trading_bots_updated_at BEFORE UPDATE ON trading_bots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();