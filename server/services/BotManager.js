const ExchangeConnector = require('./ExchangeConnector');
const TradingStrategies = require('./TradingStrategies');

class BotManager {
  constructor(supabase) {
    this.supabase = supabase;
    this.exchangeConnector = new ExchangeConnector();
    this.tradingStrategies = new TradingStrategies();
    this.activeBots = new Map();
    this.isRunning = false;
  }

  async start() {
    console.log('🤖 Starting Bot Manager...');
    this.isRunning = true;
    
    // Load all active bots
    await this.loadActiveBots();
    
    // Start monitoring loop
    this.startMonitoringLoop();
    
    console.log(`✅ Bot Manager started with ${this.activeBots.size} active bots`);
  }

  async stop() {
    console.log('🛑 Stopping Bot Manager...');
    this.isRunning = false;
    
    // Stop all active bots
    for (const [botId, bot] of this.activeBots) {
      await this.stopBot(botId);
    }
    
    console.log('✅ Bot Manager stopped');
  }

  async loadActiveBots() {
    try {
      const { data: bots, error } = await this.supabase
        .from('trading_bots')
        .select(`
          *,
          api_key:api_keys(*),
          exchange:exchanges(*)
        `)
        .eq('status', 'running');

      if (error) throw error;

      for (const bot of bots || []) {
        await this.initializeBot(bot);
      }
    } catch (error) {
      console.error('Error loading active bots:', error);
    }
  }

  async initializeBot(botData) {
    try {
      const bot = {
        id: botData.id,
        userId: botData.user_id,
        name: botData.name,
        strategy: botData.strategy_type,
        config: botData.config,
        exchange: botData.exchange,
        apiKey: botData.api_key,
        tradingPair: botData.trading_pair,
        status: 'running',
        lastUpdate: new Date(),
        positions: [],
        orders: [],
        performance: {
          totalTrades: botData.total_trades || 0,
          totalProfit: botData.total_profit || 0,
          winRate: botData.win_rate || 0,
        }
      };

      // Initialize exchange connection
      const exchangeClient = await this.exchangeConnector.connect(
        botData.exchange.name,
        botData.api_key.api_key,
        botData.api_key.api_secret,
        botData.api_key.passphrase
      );

      bot.exchangeClient = exchangeClient;

      // Initialize strategy
      const strategy = this.tradingStrategies.createStrategy(
        botData.strategy_type,
        botData.config
      );

      bot.strategy = strategy;

      this.activeBots.set(bot.id, bot);
      
      console.log(`🤖 Bot initialized: ${bot.name} (${bot.strategy})`);
    } catch (error) {
      console.error(`Error initializing bot ${botData.id}:`, error);
      
      // Update bot status to error
      await this.supabase
        .from('trading_bots')
        .update({
          status: 'error',
          error_message: error.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', botData.id);
    }
  }

  async startBot(botId) {
    try {
      const { data: botData, error } = await this.supabase
        .from('trading_bots')
        .select(`
          *,
          api_key:api_keys(*),
          exchange:exchanges(*)
        `)
        .eq('id', botId)
        .single();

      if (error) throw error;

      await this.initializeBot(botData);

      // Update bot status
      await this.supabase
        .from('trading_bots')
        .update({
          status: 'running',
          started_at: new Date().toISOString(),
          error_message: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', botId);

      return { success: true };
    } catch (error) {
      console.error(`Error starting bot ${botId}:`, error);
      return { success: false, error: error.message };
    }
  }

  async stopBot(botId) {
    try {
      const bot = this.activeBots.get(botId);
      
      if (bot) {
        // Cancel all open orders
        if (bot.exchangeClient && bot.orders.length > 0) {
          for (const order of bot.orders) {
            try {
              await bot.exchangeClient.cancelOrder(order.id, bot.tradingPair);
            } catch (error) {
              console.error(`Error canceling order ${order.id}:`, error);
            }
          }
        }

        // Remove from active bots
        this.activeBots.delete(botId);
      }

      // Update bot status
      await this.supabase
        .from('trading_bots')
        .update({
          status: 'stopped',
          stopped_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', botId);

      console.log(`🛑 Bot stopped: ${botId}`);
      return { success: true };
    } catch (error) {
      console.error(`Error stopping bot ${botId}:`, error);
      return { success: false, error: error.message };
    }
  }

  async pauseBot(botId) {
    try {
      const bot = this.activeBots.get(botId);
      
      if (bot) {
        bot.status = 'paused';
      }

      await this.supabase
        .from('trading_bots')
        .update({
          status: 'paused',
          updated_at: new Date().toISOString()
        })
        .eq('id', botId);

      return { success: true };
    } catch (error) {
      console.error(`Error pausing bot ${botId}:`, error);
      return { success: false, error: error.message };
    }
  }

  async processPendingSignals() {
    try {
      // Get all unprocessed signals
      const { data: signals, error } = await this.supabase
        .from('bot_signals')
        .select(`
          *,
          bot:trading_bots(*)
        `)
        .eq('processed', false)
        .order('created_at', { ascending: true });

      if (error) throw error;

      for (const signal of signals || []) {
        await this.processSignal(signal);
      }
    } catch (error) {
      console.error('Error processing pending signals:', error);
    }
  }

  async processSignal(signal) {
    try {
      const bot = this.activeBots.get(signal.bot_id);
      
      if (!bot || bot.status !== 'running') {
        // Mark signal as processed with error
        await this.supabase
          .from('bot_signals')
          .update({
            processed: true,
            processed_at: new Date().toISOString(),
            error_message: 'Bot not running'
          })
          .eq('id', signal.id);
        return;
      }

      // Process signal based on type
      let result;
      switch (signal.signal_type) {
        case 'buy':
          result = await this.executeBuySignal(bot, signal);
          break;
        case 'sell':
          result = await this.executeSellSignal(bot, signal);
          break;
        case 'close':
          result = await this.executeCloseSignal(bot, signal);
          break;
        case 'update_tp':
          result = await this.updateTakeProfit(bot, signal);
          break;
        case 'update_sl':
          result = await this.updateStopLoss(bot, signal);
          break;
        default:
          throw new Error(`Unknown signal type: ${signal.signal_type}`);
      }

      // Mark signal as processed
      await this.supabase
        .from('bot_signals')
        .update({
          processed: true,
          processed_at: new Date().toISOString(),
          error_message: result.success ? null : result.error
        })
        .eq('id', signal.id);

      console.log(`📡 Signal processed: ${signal.signal_type} for bot ${bot.name}`);
    } catch (error) {
      console.error(`Error processing signal ${signal.id}:`, error);
      
      // Mark signal as processed with error
      await this.supabase
        .from('bot_signals')
        .update({
          processed: true,
          processed_at: new Date().toISOString(),
          error_message: error.message
        })
        .eq('id', signal.id);
    }
  }

  async executeBuySignal(bot, signal) {
    try {
      const orderParams = {
        symbol: signal.symbol,
        side: 'buy',
        type: 'market',
        quantity: signal.quantity,
        price: signal.price,
      };

      // Execute order through exchange
      const order = await bot.exchangeClient.createOrder(orderParams);

      // Record trade
      await this.recordTrade(bot, order, signal);

      return { success: true, order };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async executeSellSignal(bot, signal) {
    try {
      const orderParams = {
        symbol: signal.symbol,
        side: 'sell',
        type: 'market',
        quantity: signal.quantity,
        price: signal.price,
      };

      const order = await bot.exchangeClient.createOrder(orderParams);
      await this.recordTrade(bot, order, signal);

      return { success: true, order };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async recordTrade(bot, order, signal) {
    try {
      await this.supabase
        .from('trades')
        .insert({
          user_id: bot.userId,
          bot_id: bot.id,
          exchange_id: bot.exchange.id,
          exchange_order_id: order.id,
          symbol: order.symbol,
          side: order.side,
          type: order.type,
          quantity: order.quantity,
          price: order.price,
          executed_price: order.executed_price,
          executed_quantity: order.executed_quantity,
          fee: order.fee || 0,
          fee_currency: order.fee_currency,
          status: order.status,
          is_futures: bot.exchange.supports_futures && signal.leverage > 1,
          leverage: signal.leverage || 1,
          executed_at: new Date().toISOString()
        });

      // Update bot performance
      await this.updateBotPerformance(bot.id);
    } catch (error) {
      console.error('Error recording trade:', error);
    }
  }

  async updateBotPerformance(botId) {
    try {
      // Calculate performance metrics
      const { data: trades } = await this.supabase
        .from('trades')
        .select('profit_loss, status')
        .eq('bot_id', botId);

      const completedTrades = trades?.filter(t => t.status === 'filled') || [];
      const totalTrades = completedTrades.length;
      const totalProfit = completedTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
      const winningTrades = completedTrades.filter(t => (t.profit_loss || 0) > 0).length;
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

      // Update bot record
      await this.supabase
        .from('trading_bots')
        .update({
          total_trades: totalTrades,
          total_profit: totalProfit,
          win_rate: winRate,
          last_trade_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', botId);
    } catch (error) {
      console.error(`Error updating bot performance ${botId}:`, error);
    }
  }

  async updateBotMetrics() {
    for (const [botId, bot] of this.activeBots) {
      try {
        // Update performance metrics
        await this.updateBotPerformance(botId);

        // Update current balance
        if (bot.exchangeClient) {
          const balance = await bot.exchangeClient.getBalance();
          const currentBalance = balance[bot.config.base_currency] || 0;

          await this.supabase
            .from('trading_bots')
            .update({
              current_balance: currentBalance,
              updated_at: new Date().toISOString()
            })
            .eq('id', botId);
        }
      } catch (error) {
        console.error(`Error updating metrics for bot ${botId}:`, error);
      }
    }
  }

  async syncExchangeBalances() {
    console.log('💰 Syncing exchange balances...');
    
    for (const [botId, bot] of this.activeBots) {
      try {
        if (bot.exchangeClient) {
          const balance = await bot.exchangeClient.getBalance();
          
          // Update user's total balance
          const totalBalance = Object.values(balance).reduce((sum, amount) => sum + amount, 0);
          
          await this.supabase
            .from('users')
            .update({
              total_balance: totalBalance,
              updated_at: new Date().toISOString()
            })
            .eq('id', bot.userId);
        }
      } catch (error) {
        console.error(`Error syncing balance for bot ${botId}:`, error);
      }
    }
  }

  async dailyMaintenance() {
    console.log('🧹 Running daily maintenance...');
    
    try {
      // Cleanup old processed signals (older than 30 days)
      await this.supabase
        .from('bot_signals')
        .delete()
        .eq('processed', true)
        .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Cleanup old audit logs (older than 90 days)
      await this.supabase
        .from('audit_logs')
        .delete()
        .lt('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

      console.log('✅ Daily maintenance completed');
    } catch (error) {
      console.error('Error during daily maintenance:', error);
    }
  }

  startMonitoringLoop() {
    setInterval(async () => {
      if (!this.isRunning) return;

      for (const [botId, bot] of this.activeBots) {
        try {
          if (bot.status === 'running') {
            // Execute strategy logic
            await this.executeStrategy(bot);
          }
        } catch (error) {
          console.error(`Error in monitoring loop for bot ${botId}:`, error);
          
          // Update bot status to error
          await this.supabase
            .from('trading_bots')
            .update({
              status: 'error',
              error_message: error.message,
              updated_at: new Date().toISOString()
            })
            .eq('id', botId);

          // Remove from active bots
          this.activeBots.delete(botId);
        }
      }
    }, 10000); // Run every 10 seconds
  }

  async executeStrategy(bot) {
    try {
      // Get current market data
      const ticker = await bot.exchangeClient.getTicker(bot.tradingPair);
      const orderbook = await bot.exchangeClient.getOrderbook(bot.tradingPair);

      // Execute strategy-specific logic
      const signals = await bot.strategy.analyze({
        ticker,
        orderbook,
        bot,
        currentTime: new Date()
      });

      // Process generated signals
      for (const signal of signals) {
        await this.processGeneratedSignal(bot, signal);
      }
    } catch (error) {
      console.error(`Error executing strategy for bot ${bot.id}:`, error);
    }
  }

  async processGeneratedSignal(bot, signal) {
    try {
      // Create signal record
      const { data: signalRecord } = await this.supabase
        .from('bot_signals')
        .insert({
          bot_id: bot.id,
          signal_type: signal.type,
          symbol: signal.symbol,
          price: signal.price,
          quantity: signal.quantity,
          take_profit: signal.takeProfit,
          stop_loss: signal.stopLoss,
          leverage: signal.leverage,
          signal_data: signal.data,
          processed: false
        })
        .select()
        .single();

      // Process immediately
      if (signalRecord) {
        await this.processSignal(signalRecord);
      }
    } catch (error) {
      console.error('Error processing generated signal:', error);
    }
  }
}

module.exports = BotManager;