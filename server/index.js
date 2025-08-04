const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middleware
app.use(cors());
app.use(express.json());

// Import route handlers
const authRoutes = require('./routes/auth');
const botRoutes = require('./routes/bots');
const tradeRoutes = require('./routes/trades');
const webhookRoutes = require('./routes/webhooks');
const exchangeRoutes = require('./routes/exchanges');
const adminRoutes = require('./routes/admin');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bots', botRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/exchanges', exchangeRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Bot management system
const BotManager = require('./services/BotManager');
const botManager = new BotManager(supabase);

// Start bot manager
botManager.start();

// Cron jobs for automated tasks
cron.schedule('*/1 * * * *', async () => {
  // Run every minute - process bot signals and execute trades
  await botManager.processPendingSignals();
});

cron.schedule('*/5 * * * *', async () => {
  // Run every 5 minutes - update bot performance metrics
  await botManager.updateBotMetrics();
});

cron.schedule('0 * * * *', async () => {
  // Run every hour - sync exchange balances
  await botManager.syncExchangeBalances();
});

cron.schedule('0 0 * * *', async () => {
  // Run daily - cleanup old data and generate reports
  await botManager.dailyMaintenance();
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Bot manager started`);
  console.log(`⏰ Cron jobs scheduled`);
});

module.exports = app;