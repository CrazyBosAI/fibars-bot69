/*
  # Complete Crypto Trading Platform Schema

  1. New Tables
    - `users` - User accounts with subscription and referral tracking
    - `user_profiles` - Extended user profile information
    - `exchanges` - Supported cryptocurrency exchanges
    - `api_keys` - User API keys for exchanges (encrypted)
    - `trading_symbols` - Available trading pairs per exchange
    - `bot_templates` - Pre-configured bot strategies
    - `trading_bots` - User's trading bots
    - `bot_signals` - Webhook signals for signal bots
    - `trades` - Trading history and execution records
    - `subscriptions` - User subscription management
    - `referrals` - Referral program tracking
    - `admin_users` - Admin user management
    - `notifications` - User notifications
    - `audit_logs` - System audit trail

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for user data access
    - Admin-only policies for system management
    - Secure API key storage with encryption

  3. Features
    - Multi-exchange support (Binance, OKX, Bybit, KuCoin)
    - Multiple account types (Spot, Futures, Copy Trading)
    - Advanced bot strategies (Grid, DCA, Signal, Copy Trading)
    - Webhook integration for TradingView signals
    - Subscription tiers with feature restrictions
    - Referral commission system
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing policies to avoid conflicts
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "Users can read own data" ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can update own data" ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can manage own data" ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Admins can manage all data" ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Users table
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

-- User profiles table
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
    account_types jsonb DEFAULT '["spot"]'::jsonb,
    is_active boolean DEFAULT true,
    fee_structure jsonb,
    created_at timestamptz DEFAULT now()
);

-- Trading symbols table
CREATE TABLE IF NOT EXISTS trading_symbols (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    exchange_id uuid REFERENCES exchanges(id) ON DELETE CASCADE,
    symbol text NOT NULL,
    base_asset text NOT NULL,
    quote_asset text NOT NULL,
    account_type text DEFAULT 'spot' CHECK (account_type IN ('spot', 'futures', 'copy_trading')),
    is_active boolean DEFAULT true,
    min_quantity numeric(20,8),
    max_quantity numeric(20,8),
    min_price numeric(20,8),
    max_price numeric(20,8),
    price_precision integer DEFAULT 8,
    quantity_precision integer DEFAULT 8,
    created_at timestamptz DEFAULT now(),
    UNIQUE(exchange_id, symbol, account_type)
);

-- API keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    exchange_id uuid REFERENCES exchanges(id) ON DELETE CASCADE,
    name text NOT NULL,
    account_type text DEFAULT 'spot' CHECK (account_type IN ('spot', 'futures', 'copy_trading')),
    encrypted_api_key bytea NOT NULL,
    encrypted_api_secret bytea NOT NULL,
    encrypted_passphrase bytea,
    permissions jsonb DEFAULT '["read"]'::jsonb,
    whitelisted_ips text[],
    is_active boolean DEFAULT true,
    last_used_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, exchange_id, name)
);

-- Bot templates table
CREATE TABLE IF NOT EXISTS bot_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    description text,
    strategy_type text NOT NULL CHECK (strategy_type IN ('grid', 'dca', 'scalping', 'swing', 'arbitrage', 'signal', 'copy_trading')),
    account_types jsonb DEFAULT '["spot"]'::jsonb,
    default_config jsonb NOT NULL,
    min_balance numeric(20,8),
    risk_level text CHECK (risk_level IN ('low', 'medium', 'high')),
    is_premium boolean DEFAULT false,
    created_by uuid REFERENCES users(id),
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Trading bots table
CREATE TABLE IF NOT EXISTS trading_bots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    exchange_id uuid REFERENCES exchanges(id),
    api_key_id uuid REFERENCES api_keys(id),
    template_id uuid REFERENCES bot_templates(id),
    name text NOT NULL,
    strategy_type text NOT NULL CHECK (strategy_type IN ('grid', 'dca', 'scalping', 'swing', 'arbitrage', 'signal', 'copy_trading')),
    account_type text DEFAULT 'spot' CHECK (account_type IN ('spot', 'futures', 'copy_trading')),
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
    lead_trader_profile jsonb,
    started_at timestamptz,
    stopped_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, name)
);

-- Bot signals table
CREATE TABLE IF NOT EXISTS bot_signals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id uuid REFERENCES trading_bots(id) ON DELETE CASCADE,
    signal_type text NOT NULL CHECK (signal_type IN ('buy', 'sell', 'close', 'update_tp', 'update_sl', 'long', 'short')),
    symbol text NOT NULL,
    price numeric(20,8),
    quantity numeric(20,8),
    take_profit numeric(20,8),
    stop_loss numeric(20,8),
    trailing_stop numeric(5,2),
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
    account_type text DEFAULT 'spot' CHECK (account_type IN ('spot', 'futures', 'copy_trading')),
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
    take_profit numeric(20,8),
    stop_loss numeric(20,8),
    trailing_stop numeric(5,2),
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
    permissions jsonb DEFAULT '[]'::jsonb,
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

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_symbols ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users policies
CREATE POLICY "Users can read own data" ON users FOR SELECT TO authenticated USING (auth_id = auth.uid());
CREATE POLICY "Users can update own data" ON users FOR UPDATE TO authenticated USING (auth_id = auth.uid());
CREATE POLICY "Admins can read all users" ON users FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM admin_users au 
        JOIN users u ON au.user_id = u.id 
        WHERE u.auth_id = auth.uid() AND au.is_active = true
    )
);
CREATE POLICY "Admins can manage all users" ON users FOR ALL TO authenticated USING (
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

-- Exchanges policies (public read, admin manage)
CREATE POLICY "Anyone can read active exchanges" ON exchanges FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage exchanges" ON exchanges FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM admin_users au 
        JOIN users u ON au.user_id = u.id 
        WHERE u.auth_id = auth.uid() AND au.is_active = true
    )
);

-- Trading symbols policies (public read, admin manage)
CREATE POLICY "Anyone can read active symbols" ON trading_symbols FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage symbols" ON trading_symbols FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM admin_users au 
        JOIN users u ON au.user_id = u.id 
        WHERE u.auth_id = auth.uid() AND au.is_active = true
    )
);

-- API keys policies
CREATE POLICY "Users can manage own API keys" ON api_keys FOR ALL TO authenticated USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
);

-- Bot templates policies (public read, admin manage)
CREATE POLICY "Anyone can read active templates" ON bot_templates FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage templates" ON bot_templates FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM admin_users au 
        JOIN users u ON au.user_id = u.id 
        WHERE u.auth_id = auth.uid() AND au.is_active = true
    )
);

-- Trading bots policies
CREATE POLICY "Users can manage own bots" ON trading_bots FOR ALL TO authenticated USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
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

-- Audit logs policies (admin only)
CREATE POLICY "Admins can manage audit logs" ON audit_logs FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM admin_users au 
        JOIN users u ON au.user_id = u.id 
        WHERE u.auth_id = auth.uid() AND au.is_active = true
    )
);

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trading_bots_updated_at BEFORE UPDATE ON trading_bots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default exchanges
INSERT INTO exchanges (name, display_name, api_url, futures_api_url, websocket_url, supports_spot, supports_futures, supports_copy_trading, account_types) VALUES
('binance', 'Binance', 'https://api.binance.com', 'https://fapi.binance.com', 'wss://stream.binance.com:9443', true, true, true, '["spot", "futures", "copy_trading"]'::jsonb),
('okx', 'OKX', 'https://www.okx.com', 'https://www.okx.com', 'wss://ws.okx.com:8443', true, true, true, '["spot", "futures", "copy_trading"]'::jsonb),
('bybit', 'Bybit', 'https://api.bybit.com', 'https://api.bybit.com', 'wss://stream.bybit.com', true, true, false, '["spot", "futures"]'::jsonb),
('kucoin', 'KuCoin', 'https://api.kucoin.com', 'https://api-futures.kucoin.com', 'wss://ws-api.kucoin.com', true, true, false, '["spot", "futures"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Insert popular trading symbols for each exchange
INSERT INTO trading_symbols (exchange_id, symbol, base_asset, quote_asset, account_type, min_quantity, price_precision, quantity_precision) 
SELECT e.id, symbol_data.symbol, symbol_data.base_asset, symbol_data.quote_asset, symbol_data.account_type, symbol_data.min_quantity, symbol_data.price_precision, symbol_data.quantity_precision
FROM exchanges e
CROSS JOIN (
    VALUES 
    ('BTC/USDT', 'BTC', 'USDT', 'spot', 0.00001, 2, 5),
    ('ETH/USDT', 'ETH', 'USDT', 'spot', 0.0001, 2, 4),
    ('BNB/USDT', 'BNB', 'USDT', 'spot', 0.001, 2, 3),
    ('ADA/USDT', 'ADA', 'USDT', 'spot', 1, 4, 0),
    ('SOL/USDT', 'SOL', 'USDT', 'spot', 0.01, 2, 2),
    ('DOT/USDT', 'DOT', 'USDT', 'spot', 0.1, 3, 1),
    ('MATIC/USDT', 'MATIC', 'USDT', 'spot', 1, 4, 0),
    ('AVAX/USDT', 'AVAX', 'USDT', 'spot', 0.01, 2, 2),
    ('LINK/USDT', 'LINK', 'USDT', 'spot', 0.01, 3, 2),
    ('UNI/USDT', 'UNI', 'USDT', 'spot', 0.01, 3, 2),
    ('BTC/USDT', 'BTC', 'USDT', 'futures', 0.001, 1, 3),
    ('ETH/USDT', 'ETH', 'USDT', 'futures', 0.01, 2, 2),
    ('BNB/USDT', 'BNB', 'USDT', 'futures', 0.1, 2, 1),
    ('ADA/USDT', 'ADA', 'USDT', 'futures', 10, 4, 0),
    ('SOL/USDT', 'SOL', 'USDT', 'futures', 0.1, 2, 1)
) AS symbol_data(symbol, base_asset, quote_asset, account_type, min_quantity, price_precision, quantity_precision)
WHERE e.is_active = true
ON CONFLICT (exchange_id, symbol, account_type) DO NOTHING;

-- Insert bot templates
INSERT INTO bot_templates (name, description, strategy_type, account_types, default_config, min_balance, risk_level, is_premium) VALUES
('Grid Trading Bot', 'Automated grid trading strategy for sideways markets', 'grid', '["spot", "futures"]'::jsonb, '{"grid_count": 10, "price_range": 10, "investment_per_grid": 100}'::jsonb, 1000, 'medium', false),
('DCA Bot', 'Dollar Cost Averaging strategy for long-term accumulation', 'dca', '["spot"]'::jsonb, '{"buy_interval": "1h", "buy_amount": 50, "max_orders": 20}'::jsonb, 500, 'low', false),
('Signal Bot', 'Execute trades based on external signals via webhooks', 'signal', '["spot", "futures"]'::jsonb, '{"max_position_size": 1000, "risk_per_trade": 2, "auto_tp_sl": true}'::jsonb, 100, 'high', false),
('Copy Trading Bot', 'Copy trades from successful lead traders', 'copy_trading', '["futures", "copy_trading"]'::jsonb, '{"copy_ratio": 1.0, "max_position_size": 5000, "stop_loss": 5}'::jsonb, 1000, 'medium', true),
('Scalping Bot', 'High-frequency trading for small profits', 'scalping', '["spot", "futures"]'::jsonb, '{"profit_target": 0.5, "stop_loss": 0.3, "max_trades_per_hour": 10}'::jsonb, 2000, 'high', true)
ON CONFLICT (name) DO NOTHING;