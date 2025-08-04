const axios = require('axios');
const crypto = require('crypto');

class ExchangeConnector {
  constructor() {
    this.connections = new Map();
  }

  async connect(exchangeName, apiKey, apiSecret, passphrase = null) {
    const connectionKey = `${exchangeName}_${apiKey}`;
    
    if (this.connections.has(connectionKey)) {
      return this.connections.get(connectionKey);
    }

    let connector;
    switch (exchangeName.toLowerCase()) {
      case 'binance':
        connector = new BinanceConnector(apiKey, apiSecret);
        break;
      case 'okx':
        connector = new OKXConnector(apiKey, apiSecret, passphrase);
        break;
      case 'bybit':
        connector = new BybitConnector(apiKey, apiSecret);
        break;
      default:
        throw new Error(`Unsupported exchange: ${exchangeName}`);
    }

    await connector.initialize();
    this.connections.set(connectionKey, connector);
    
    return connector;
  }
}

class BinanceConnector {
  constructor(apiKey, apiSecret) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseURL = 'https://api.binance.com';
    this.futuresURL = 'https://fapi.binance.com';
  }

  async initialize() {
    // Test connection
    try {
      await this.getAccountInfo();
      console.log('✅ Binance connection established');
    } catch (error) {
      throw new Error(`Failed to connect to Binance: ${error.message}`);
    }
  }

  createSignature(queryString) {
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(queryString)
      .digest('hex');
  }

  async makeRequest(endpoint, params = {}, method = 'GET', isFutures = false) {
    const baseURL = isFutures ? this.futuresURL : this.baseURL;
    const timestamp = Date.now();
    
    const queryParams = {
      ...params,
      timestamp,
    };

    const queryString = new URLSearchParams(queryParams).toString();
    const signature = this.createSignature(queryString);
    
    const url = `${baseURL}${endpoint}?${queryString}&signature=${signature}`;
    
    const config = {
      method,
      url,
      headers: {
        'X-MBX-APIKEY': this.apiKey,
      },
    };

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      throw new Error(`Binance API error: ${error.response?.data?.msg || error.message}`);
    }
  }

  async getAccountInfo() {
    return await this.makeRequest('/api/v3/account');
  }

  async getBalance() {
    const account = await this.getAccountInfo();
    const balances = {};
    
    for (const balance of account.balances) {
      if (parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0) {
        balances[balance.asset] = parseFloat(balance.free) + parseFloat(balance.locked);
      }
    }
    
    return balances;
  }

  async getTicker(symbol) {
    const data = await this.makeRequest('/api/v3/ticker/24hr', { symbol });
    return {
      symbol: data.symbol,
      price: parseFloat(data.lastPrice),
      change: parseFloat(data.priceChangePercent),
      volume: parseFloat(data.volume),
    };
  }

  async getOrderbook(symbol, limit = 100) {
    const data = await this.makeRequest('/api/v3/depth', { symbol, limit });
    return {
      bids: data.bids.map(([price, quantity]) => [parseFloat(price), parseFloat(quantity)]),
      asks: data.asks.map(([price, quantity]) => [parseFloat(price), parseFloat(quantity)]),
    };
  }

  async createOrder(params) {
    const orderParams = {
      symbol: params.symbol,
      side: params.side.toUpperCase(),
      type: params.type.toUpperCase(),
      quantity: params.quantity,
    };

    if (params.price) {
      orderParams.price = params.price;
    }

    if (params.type.toLowerCase() === 'market') {
      orderParams.type = 'MARKET';
    } else {
      orderParams.type = 'LIMIT';
      orderParams.timeInForce = 'GTC';
    }

    const data = await this.makeRequest('/api/v3/order', orderParams, 'POST');
    
    return {
      id: data.orderId,
      symbol: data.symbol,
      side: data.side.toLowerCase(),
      type: data.type.toLowerCase(),
      quantity: parseFloat(data.origQty),
      price: parseFloat(data.price || 0),
      executed_price: parseFloat(data.price || 0),
      executed_quantity: parseFloat(data.executedQty || 0),
      status: data.status.toLowerCase(),
      fee: 0, // Will be calculated separately
    };
  }

  async cancelOrder(orderId, symbol) {
    return await this.makeRequest('/api/v3/order', { 
      symbol, 
      orderId 
    }, 'DELETE');
  }

  async getOpenOrders(symbol) {
    return await this.makeRequest('/api/v3/openOrders', { symbol });
  }

  // Futures trading methods
  async createFuturesOrder(params) {
    const orderParams = {
      symbol: params.symbol,
      side: params.side.toUpperCase(),
      type: params.type.toUpperCase(),
      quantity: params.quantity,
    };

    if (params.leverage) {
      // Set leverage first
      await this.makeRequest('/fapi/v1/leverage', {
        symbol: params.symbol,
        leverage: params.leverage
      }, 'POST', true);
    }

    if (params.price) {
      orderParams.price = params.price;
    }

    const data = await this.makeRequest('/fapi/v1/order', orderParams, 'POST', true);
    
    return {
      id: data.orderId,
      symbol: data.symbol,
      side: data.side.toLowerCase(),
      type: data.type.toLowerCase(),
      quantity: parseFloat(data.origQty),
      price: parseFloat(data.price || 0),
      executed_price: parseFloat(data.avgPrice || 0),
      executed_quantity: parseFloat(data.executedQty || 0),
      status: data.status.toLowerCase(),
      fee: 0,
    };
  }
}

class OKXConnector {
  constructor(apiKey, apiSecret, passphrase) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.passphrase = passphrase;
    this.baseURL = 'https://www.okx.com';
  }

  async initialize() {
    try {
      await this.getAccountInfo();
      console.log('✅ OKX connection established');
    } catch (error) {
      throw new Error(`Failed to connect to OKX: ${error.message}`);
    }
  }

  createSignature(timestamp, method, requestPath, body = '') {
    const message = timestamp + method + requestPath + body;
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(message)
      .digest('base64');
  }

  async makeRequest(endpoint, params = {}, method = 'GET') {
    const timestamp = new Date().toISOString();
    const requestPath = endpoint + (Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '');
    const body = method === 'POST' ? JSON.stringify(params) : '';
    
    const signature = this.createSignature(timestamp, method, requestPath, body);
    
    const config = {
      method,
      url: `${this.baseURL}${requestPath}`,
      headers: {
        'OK-ACCESS-KEY': this.apiKey,
        'OK-ACCESS-SIGN': signature,
        'OK-ACCESS-TIMESTAMP': timestamp,
        'OK-ACCESS-PASSPHRASE': this.passphrase,
        'Content-Type': 'application/json',
      },
    };

    if (method === 'POST') {
      config.data = body;
    }

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      throw new Error(`OKX API error: ${error.response?.data?.msg || error.message}`);
    }
  }

  async getAccountInfo() {
    return await this.makeRequest('/api/v5/account/balance');
  }

  async getBalance() {
    const data = await this.getAccountInfo();
    const balances = {};
    
    if (data.data && data.data[0] && data.data[0].details) {
      for (const balance of data.data[0].details) {
        if (parseFloat(balance.availBal) > 0) {
          balances[balance.ccy] = parseFloat(balance.availBal);
        }
      }
    }
    
    return balances;
  }

  async getTicker(symbol) {
    // Convert symbol format (BTC/USDT -> BTC-USDT)
    const okxSymbol = symbol.replace('/', '-');
    const data = await this.makeRequest('/api/v5/market/ticker', { instId: okxSymbol });
    
    if (data.data && data.data[0]) {
      const ticker = data.data[0];
      return {
        symbol: symbol,
        price: parseFloat(ticker.last),
        change: parseFloat(ticker.changePercent),
        volume: parseFloat(ticker.vol24h),
      };
    }
    
    throw new Error('No ticker data received');
  }

  async createOrder(params) {
    const orderParams = {
      instId: params.symbol.replace('/', '-'),
      tdMode: 'cash',
      side: params.side,
      ordType: params.type,
      sz: params.quantity.toString(),
    };

    if (params.price) {
      orderParams.px = params.price.toString();
    }

    const data = await this.makeRequest('/api/v5/trade/order', orderParams, 'POST');
    
    if (data.data && data.data[0]) {
      const order = data.data[0];
      return {
        id: order.ordId,
        symbol: params.symbol,
        side: params.side,
        type: params.type,
        quantity: parseFloat(params.quantity),
        price: parseFloat(params.price || 0),
        executed_price: parseFloat(order.avgPx || 0),
        executed_quantity: parseFloat(order.fillSz || 0),
        status: order.state,
        fee: 0,
      };
    }
    
    throw new Error('Failed to create order');
  }
}

class BybitConnector {
  constructor(apiKey, apiSecret) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseURL = 'https://api.bybit.com';
  }

  async initialize() {
    try {
      await this.getAccountInfo();
      console.log('✅ Bybit connection established');
    } catch (error) {
      throw new Error(`Failed to connect to Bybit: ${error.message}`);
    }
  }

  createSignature(params) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(sortedParams)
      .digest('hex');
  }

  async makeRequest(endpoint, params = {}, method = 'GET') {
    const timestamp = Date.now();
    const requestParams = {
      ...params,
      api_key: this.apiKey,
      timestamp,
    };

    const signature = this.createSignature(requestParams);
    requestParams.sign = signature;

    const config = {
      method,
      url: `${this.baseURL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (method === 'GET') {
      config.params = requestParams;
    } else {
      config.data = requestParams;
    }

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      throw new Error(`Bybit API error: ${error.response?.data?.ret_msg || error.message}`);
    }
  }

  async getAccountInfo() {
    return await this.makeRequest('/v2/private/wallet/balance');
  }

  async getBalance() {
    const data = await this.getAccountInfo();
    const balances = {};
    
    if (data.result) {
      for (const [currency, balance] of Object.entries(data.result)) {
        if (balance.available_balance > 0) {
          balances[currency] = parseFloat(balance.available_balance);
        }
      }
    }
    
    return balances;
  }

  async getTicker(symbol) {
    const data = await this.makeRequest('/v2/public/tickers', { symbol });
    
    if (data.result && data.result[0]) {
      const ticker = data.result[0];
      return {
        symbol: ticker.symbol,
        price: parseFloat(ticker.last_price),
        change: parseFloat(ticker.price_24h_pcnt),
        volume: parseFloat(ticker.volume_24h),
      };
    }
    
    throw new Error('No ticker data received');
  }

  async createOrder(params) {
    const orderParams = {
      symbol: params.symbol,
      side: params.side,
      order_type: params.type,
      qty: params.quantity,
    };

    if (params.price) {
      orderParams.price = params.price;
    }

    const data = await this.makeRequest('/v2/private/order/create', orderParams, 'POST');
    
    if (data.result) {
      const order = data.result;
      return {
        id: order.order_id,
        symbol: order.symbol,
        side: order.side,
        type: order.order_type,
        quantity: parseFloat(order.qty),
        price: parseFloat(order.price || 0),
        executed_price: parseFloat(order.price || 0),
        executed_quantity: 0,
        status: order.order_status,
        fee: 0,
      };
    }
    
    throw new Error('Failed to create order');
  }
}

module.exports = ExchangeConnector;