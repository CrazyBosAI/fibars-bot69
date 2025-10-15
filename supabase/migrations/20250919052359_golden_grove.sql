/*
  # Add Enterprise User with Full Functionality

  1. New User
    - Email: test69@fibars.com
    - Password: test69Fibars (will be hashed by Supabase Auth)
    - Enterprise subscription tier
    - Email verified
    - Full functionality enabled

  2. User Profile
    - Complete profile setup
    - Trading experience: expert
    - Risk tolerance: high
    - All notifications enabled

  3. Sample Data
    - API keys for multiple exchanges
    - Sample trading bots
    - Referral data
    - Trading history
    - Notifications

  4. Security
    - Proper RLS policies apply
    - Enterprise-level permissions
*/

-- Insert the enterprise user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token,
  aud,
  role
) VALUES (
  'e8f5a2d1-4b3c-4d5e-8f9a-1b2c3d4e5f6a',
  '00000000-0000-0000-0000-000000000000',
  'test69@fibars.com',
  crypt('test69Fibars', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  '',
  'authenticated',
  'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- Insert user record
INSERT INTO users (
  id,
  auth_id,
  email,
  username,
  full_name,
  avatar_url,
  subscription_tier,
  subscription_status,
  subscription_expires_at,
  total_balance,
  total_profit,
  referral_code,
  is_verified,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'e8f5a2d1-4b3c-4d5e-8f9a-1b2c3d4e5f6a',
  'test69@fibars.com',
  'test69_trader',
  'Test Enterprise User',
  'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
  'enterprise',
  'active',
  now() + interval '1 year',
  50000.00000000,
  12500.75000000,
  'TEST69FIBARS',
  true,
  now(),
  now()
) ON CONFLICT (email) DO UPDATE SET
  subscription_tier = EXCLUDED.subscription_tier,
  subscription_status = EXCLUDED.subscription_status,
  subscription_expires_at = EXCLUDED.subscription_expires_at,
  total_balance = EXCLUDED.total_balance,
  total_profit = EXCLUDED.total_profit,
  is_verified = EXCLUDED.is_verified;

-- Get the user ID for subsequent inserts
DO $$
DECLARE
  user_uuid uuid;
BEGIN
  SELECT id INTO user_uuid FROM users WHERE email = 'test69@fibars.com';

  -- Insert user profile
  INSERT INTO user_profiles (
    user_id,
    phone,
    country,
    timezone,
    language,
    two_factor_enabled,
    email_notifications,
    push_notifications,
    trading_experience,
    risk_tolerance,
    created_at,
    updated_at
  ) VALUES (
    user_uuid,
    '+1-555-0123',
    'United States',
    'America/New_York',
    'en',
    true,
    true,
    true,
    'expert',
    'high',
    now(),
    now()
  ) ON CONFLICT (user_id) DO UPDATE SET
    trading_experience = EXCLUDED.trading_experience,
    risk_tolerance = EXCLUDED.risk_tolerance,
    two_factor_enabled = EXCLUDED.two_factor_enabled;

  -- Insert API keys for multiple exchanges
  INSERT INTO api_keys (
    user_id,
    exchange_id,
    name,
    encrypted_api_key,
    encrypted_api_secret,
    encrypted_passphrase,
    permissions,
    is_active,
    created_at,
    updated_at
  ) VALUES 
  (
    user_uuid,
    (SELECT id FROM exchanges WHERE name = 'binance' LIMIT 1),
    'Binance Main Account',
    encode('encrypted_binance_api_key_test69', 'base64')::bytea,
    encode('encrypted_binance_secret_test69', 'base64')::bytea,
    NULL,
    '["read", "trade", "futures"]'::jsonb,
    true,
    now(),
    now()
  ),
  (
    user_uuid,
    (SELECT id FROM exchanges WHERE name = 'okx' LIMIT 1),
    'OKX Trading Account',
    encode('encrypted_okx_api_key_test69', 'base64')::bytea,
    encode('encrypted_okx_secret_test69', 'base64')::bytea,
    encode('encrypted_okx_passphrase_test69', 'base64')::bytea,
    '["read", "trade", "futures"]'::jsonb,
    true,
    now(),
    now()
  ) ON CONFLICT (user_id, exchange_id, name) DO NOTHING;

  -- Insert sample trading bots
  INSERT INTO trading_bots (
    user_id,
    exchange_id,
    api_key_id,
    name,
    strategy_type,
    trading_pair,
    base_currency,
    quote_currency,
    status,
    config,
    initial_balance,
    current_balance,
    total_profit,
    total_trades,
    win_rate,
    max_drawdown,
    last_trade_at,
    started_at,
    created_at,
    updated_at
  ) VALUES 
  (
    user_uuid,
    (SELECT id FROM exchanges WHERE name = 'binance' LIMIT 1),
    (SELECT id FROM api_keys WHERE user_id = user_uuid AND name = 'Binance Main Account' LIMIT 1),
    'BTC Grid Bot Pro',
    'grid',
    'BTCUSDT',
    'BTC',
    'USDT',
    'running',
    '{
      "grid_count": 20,
      "price_range": {"min": 40000, "max": 50000},
      "investment": 10000,
      "profit_per_grid": 0.5
    }'::jsonb,
    10000.00000000,
    12500.75000000,
    2500.75000000,
    156,
    78.50,
    5.25,
    now() - interval '2 hours',
    now() - interval '7 days',
    now() - interval '7 days',
    now()
  ),
  (
    user_uuid,
    (SELECT id FROM exchanges WHERE name = 'okx' LIMIT 1),
    (SELECT id FROM api_keys WHERE user_id = user_uuid AND name = 'OKX Trading Account' LIMIT 1),
    'ETH DCA Strategy',
    'dca',
    'ETHUSDT',
    'ETH',
    'USDT',
    'running',
    '{
      "investment_amount": 500,
      "frequency": "daily",
      "take_profit": 15,
      "stop_loss": 10
    }'::jsonb,
    15000.00000000,
    18750.25000000,
    3750.25000000,
    89,
    82.00,
    3.80,
    now() - interval '1 hour',
    now() - interval '14 days',
    now() - interval '14 days',
    now()
  ),
  (
    user_uuid,
    (SELECT id FROM exchanges WHERE name = 'binance' LIMIT 1),
    (SELECT id FROM api_keys WHERE user_id = user_uuid AND name = 'Binance Main Account' LIMIT 1),
    'Signal Trading Bot',
    'signal',
    'SOLUSDT',
    'SOL',
    'USDT',
    'paused',
    '{
      "webhook_url": "https://webhook.site/test69",
      "position_size": 1000,
      "max_positions": 3
    }'::jsonb,
    5000.00000000,
    4850.50000000,
    -149.50000000,
    23,
    65.22,
    8.90,
    now() - interval '6 hours',
    now() - interval '3 days',
    now() - interval '3 days',
    now()
  ) ON CONFLICT (user_id, name) DO NOTHING;

  -- Insert sample trades
  INSERT INTO trades (
    user_id,
    bot_id,
    exchange_id,
    exchange_order_id,
    symbol,
    side,
    type,
    quantity,
    price,
    executed_price,
    executed_quantity,
    fee,
    fee_currency,
    status,
    profit_loss,
    is_futures,
    leverage,
    executed_at,
    created_at
  ) VALUES 
  (
    user_uuid,
    (SELECT id FROM trading_bots WHERE user_id = user_uuid AND name = 'BTC Grid Bot Pro' LIMIT 1),
    (SELECT id FROM exchanges WHERE name = 'binance' LIMIT 1),
    'BIN_ORDER_123456789',
    'BTCUSDT',
    'buy',
    'limit',
    0.25000000,
    45000.00000000,
    44995.50000000,
    0.25000000,
    11.25000000,
    'USDT',
    'filled',
    125.75000000,
    false,
    1,
    now() - interval '2 hours',
    now() - interval '2 hours'
  ),
  (
    user_uuid,
    (SELECT id FROM trading_bots WHERE user_id = user_uuid AND name = 'ETH DCA Strategy' LIMIT 1),
    (SELECT id FROM exchanges WHERE name = 'okx' LIMIT 1),
    'OKX_ORDER_987654321',
    'ETHUSDT',
    'buy',
    'market',
    15.50000000,
    2500.00000000,
    2498.75000000,
    15.50000000,
    38.73000000,
    'USDT',
    'filled',
    285.50000000,
    false,
    1,
    now() - interval '1 hour',
    now() - interval '1 hour'
  ) ON CONFLICT DO NOTHING;

  -- Insert referral data
  INSERT INTO referrals (
    referrer_id,
    referred_id,
    referral_code,
    commission_rate,
    total_commission,
    status,
    created_at
  ) VALUES 
  (
    user_uuid,
    (SELECT id FROM users WHERE email != 'test69@fibars.com' LIMIT 1),
    'TEST69FIBARS',
    15.00,
    750.25000000,
    'active',
    now() - interval '30 days'
  ) ON CONFLICT (referrer_id, referred_id) DO NOTHING;

  -- Insert subscription record
  INSERT INTO subscriptions (
    user_id,
    stripe_subscription_id,
    stripe_customer_id,
    plan_name,
    plan_price,
    billing_cycle,
    status,
    current_period_start,
    current_period_end,
    created_at
  ) VALUES (
    user_uuid,
    'sub_test69enterprise',
    'cus_test69fibars',
    'Enterprise',
    299.00,
    'monthly',
    'active',
    now() - interval '15 days',
    now() + interval '15 days',
    now() - interval '15 days'
  ) ON CONFLICT (stripe_subscription_id) DO NOTHING;

  -- Insert notifications
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data,
    is_read,
    created_at
  ) VALUES 
  (
    user_uuid,
    'trade',
    'Successful Trade Executed',
    'Your BTC Grid Bot Pro executed a profitable trade of +$125.75',
    '{"bot_name": "BTC Grid Bot Pro", "profit": 125.75, "symbol": "BTCUSDT"}'::jsonb,
    false,
    now() - interval '2 hours'
  ),
  (
    user_uuid,
    'bot_status',
    'Bot Performance Update',
    'Your ETH DCA Strategy has achieved 82% win rate this week',
    '{"bot_name": "ETH DCA Strategy", "win_rate": 82.0, "period": "week"}'::jsonb,
    false,
    now() - interval '1 day'
  ),
  (
    user_uuid,
    'subscription',
    'Enterprise Plan Active',
    'Welcome to Enterprise! All premium features are now available.',
    '{"plan": "Enterprise", "features": ["unlimited_bots", "priority_support", "advanced_analytics"]}'::jsonb,
    true,
    now() - interval '15 days'
  ),
  (
    user_uuid,
    'referral',
    'Referral Commission Earned',
    'You earned $45.50 commission from your referral network',
    '{"commission": 45.50, "referrals_count": 3}'::jsonb,
    false,
    now() - interval '3 days'
  ) ON CONFLICT DO NOTHING;

END $$;