const express = require('express');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Webhook endpoint for signal bots
router.post('/signal/:botId', async (req, res) => {
  try {
    const { botId } = req.params;
    const signalData = req.body;
    const sourceIP = req.ip || req.connection.remoteAddress;

    // Get bot information
    const { data: bot, error: botError } = await supabase
      .from('trading_bots')
      .select('*')
      .eq('id', botId)
      .eq('strategy_type', 'signal')
      .single();

    if (botError || !bot) {
      return res.status(404).json({ error: 'Signal bot not found' });
    }

    // Verify webhook secret if configured
    if (bot.webhook_secret) {
      const signature = req.headers['x-signature'] || req.headers['signature'];
      if (!signature) {
        return res.status(401).json({ error: 'Missing signature' });
      }

      const expectedSignature = crypto
        .createHmac('sha256', bot.webhook_secret)
        .update(JSON.stringify(signalData))
        .digest('hex');

      if (signature !== expectedSignature) {
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    // Validate signal data
    const requiredFields = ['action', 'symbol'];
    for (const field of requiredFields) {
      if (!signalData[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    // Map action to signal type
    const actionMap = {
      'buy': 'buy',
      'sell': 'sell',
      'close': 'close',
      'long': 'buy',
      'short': 'sell',
      'exit': 'close',
      'update_tp': 'update_tp',
      'update_sl': 'update_sl',
    };

    const signalType = actionMap[signalData.action.toLowerCase()];
    if (!signalType) {
      return res.status(400).json({ error: `Invalid action: ${signalData.action}` });
    }

    // Create signal record
    const { data: signal, error: signalError } = await supabase
      .from('bot_signals')
      .insert({
        bot_id: botId,
        signal_type: signalType,
        symbol: signalData.symbol,
        price: signalData.price ? parseFloat(signalData.price) : null,
        quantity: signalData.quantity ? parseFloat(signalData.quantity) : null,
        take_profit: signalData.take_profit ? parseFloat(signalData.take_profit) : null,
        stop_loss: signalData.stop_loss ? parseFloat(signalData.stop_loss) : null,
        leverage: signalData.leverage ? parseInt(signalData.leverage) : null,
        signal_data: signalData,
        processed: false,
        source_ip: sourceIP,
      })
      .select()
      .single();

    if (signalError) {
      console.error('Error creating signal:', signalError);
      return res.status(500).json({ error: 'Failed to create signal' });
    }

    // Log the received signal
    console.log(`📡 Signal received for bot ${bot.name}:`, {
      type: signalType,
      symbol: signalData.symbol,
      price: signalData.price,
      quantity: signalData.quantity,
    });

    res.json({
      success: true,
      message: 'Signal received and queued for processing',
      signal_id: signal.id,
    });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// TradingView webhook endpoint
router.post('/tradingview/:botId', async (req, res) => {
  try {
    const { botId } = req.params;
    const webhookData = req.body;

    // Parse TradingView alert message
    const alertMessage = webhookData.message || webhookData.text || '';
    
    // Extract signal information from alert message
    // Expected format: "BUY BTCUSDT at 43250 qty 0.1 tp 44000 sl 42000"
    const signalRegex = /(BUY|SELL|CLOSE)\s+(\w+)\s+(?:at\s+(\d+\.?\d*))?(?:\s+qty\s+(\d+\.?\d*))?(?:\s+tp\s+(\d+\.?\d*))?(?:\s+sl\s+(\d+\.?\d*))?/i;
    const match = alertMessage.match(signalRegex);

    if (!match) {
      return res.status(400).json({ error: 'Invalid TradingView alert format' });
    }

    const [, action, symbol, price, quantity, takeProfit, stopLoss] = match;

    // Create standardized signal data
    const signalData = {
      action: action.toLowerCase(),
      symbol: symbol,
      price: price ? parseFloat(price) : null,
      quantity: quantity ? parseFloat(quantity) : null,
      take_profit: takeProfit ? parseFloat(takeProfit) : null,
      stop_loss: stopLoss ? parseFloat(stopLoss) : null,
      source: 'tradingview',
      original_message: alertMessage,
    };

    // Forward to main signal webhook
    req.body = signalData;
    return router.handle(req, res);

  } catch (error) {
    console.error('TradingView webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3Commas webhook endpoint (for compatibility)
router.post('/3commas/:botId', async (req, res) => {
  try {
    const { botId } = req.params;
    const webhookData = req.body;

    // Convert 3Commas format to our format
    const signalData = {
      action: webhookData.action || webhookData.message_type,
      symbol: webhookData.pair || webhookData.symbol,
      price: webhookData.price,
      quantity: webhookData.quantity || webhookData.amount,
      take_profit: webhookData.take_profit,
      stop_loss: webhookData.stop_loss,
      source: '3commas',
    };

    // Forward to main signal webhook
    req.body = signalData;
    return router.handle(req, res);

  } catch (error) {
    console.error('3Commas webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get webhook URL for a bot
router.get('/url/:botId', async (req, res) => {
  try {
    const { botId } = req.params;
    
    const { data: bot, error } = await supabase
      .from('trading_bots')
      .select('id, name, strategy_type, webhook_secret')
      .eq('id', botId)
      .single();

    if (error || !bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    if (bot.strategy_type !== 'signal') {
      return res.status(400).json({ error: 'Bot is not a signal bot' });
    }

    const baseUrl = process.env.WEBHOOK_BASE_URL || `${req.protocol}://${req.get('host')}`;
    
    res.json({
      webhook_urls: {
        generic: `${baseUrl}/api/webhooks/signal/${botId}`,
        tradingview: `${baseUrl}/api/webhooks/tradingview/${botId}`,
        '3commas': `${baseUrl}/api/webhooks/3commas/${botId}`,
      },
      webhook_secret: bot.webhook_secret,
      instructions: {
        generic: 'Send POST requests with JSON payload containing action, symbol, price, quantity, etc.',
        tradingview: 'Use alert message format: "BUY BTCUSDT at 43250 qty 0.1 tp 44000 sl 42000"',
        '3commas': 'Compatible with 3Commas webhook format',
      },
    });

  } catch (error) {
    console.error('Error getting webhook URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;