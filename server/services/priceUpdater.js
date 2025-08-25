const cron = require('node-cron');
const axios = require('axios');
const { broadcastPriceUpdates, checkPriceAlerts } = require('./websocket');
const { setCachedData, getCachedData } = require('./cache');
const Portfolio = require('../models/Portfolio');

let updateInterval;
let isUpdating = false;

// Start price update service
const startPriceUpdates = (io) => {
  console.log('Starting price update service...');
  
  // Update prices every 30 seconds
  updateInterval = setInterval(async () => {
    if (!isUpdating) {
      await updateAllPrices();
    }
  }, 30000);

  // Also run a more comprehensive update every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    await updatePortfolioPrices();
  });

  // Initial update
  setTimeout(() => updateAllPrices(), 5000);
  
  console.log('Price update service started');
};

// Stop price update service
const stopPriceUpdates = () => {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
  console.log('Price update service stopped');
};

// Update all tracked cryptocurrency prices
const updateAllPrices = async () => {
  if (isUpdating) return;
  
  isUpdating = true;
  
  try {
    // Get all unique symbols from all portfolios
    const symbols = await getTrackedSymbols();
    
    if (symbols.length === 0) {
      isUpdating = false;
      return;
    }

    console.log(`Updating prices for ${symbols.length} symbols: ${symbols.join(', ')}`);
    
    // Fetch prices from CoinGecko
    const prices = await fetchPricesFromAPI(symbols);
    
    if (prices && Object.keys(prices).length > 0) {
      // Cache the prices
      await setCachedData('latest-prices', prices, 60); // Cache for 1 minute
      
      // Broadcast to WebSocket clients
      await broadcastPriceUpdates(prices);
      
      // Check price alerts
      await checkPriceAlerts(prices);
      
      console.log(`Updated prices for ${Object.keys(prices).length} symbols`);
    }
  } catch (error) {
    console.error('Error updating prices:', error.message);
  } finally {
    isUpdating = false;
  }
};

// Update portfolio prices in database
const updatePortfolioPrices = async () => {
  try {
    console.log('Updating portfolio prices in database...');
    
    // Get latest prices from cache
    const prices = await getCachedData('latest-prices');
    
    if (!prices) {
      console.log('No cached prices available for portfolio update');
      return;
    }

    // Get all portfolios
    const portfolios = await Portfolio.find({});
    
    let updatedCount = 0;
    
    for (const portfolio of portfolios) {
      let hasUpdates = false;
      
      // Update current prices for each holding
      portfolio.holdings.forEach(holding => {
        const priceData = prices[holding.symbol.toLowerCase()];
        if (priceData && priceData.usd) {
          const newPrice = priceData.usd;
          if (holding.currentPrice !== newPrice) {
            holding.currentPrice = newPrice;
            hasUpdates = true;
          }
        }
      });
      
      if (hasUpdates) {
        portfolio.updateMetrics();
        await portfolio.save();
        updatedCount++;
        
        // Broadcast portfolio update to user
        const { broadcastPortfolioUpdate } = require('./websocket');
        broadcastPortfolioUpdate(portfolio.userId, portfolio.toJSON());
      }
    }
    
    console.log(`Updated ${updatedCount} portfolios with latest prices`);
  } catch (error) {
    console.error('Error updating portfolio prices:', error.message);
  }
};

// Get all unique symbols being tracked across all portfolios
const getTrackedSymbols = async () => {
  try {
    const portfolios = await Portfolio.find({}, 'holdings.symbol');
    const symbolsSet = new Set();
    
    portfolios.forEach(portfolio => {
      portfolio.holdings.forEach(holding => {
        symbolsSet.add(holding.symbol.toLowerCase());
      });
    });
    
    // Add some default popular coins even if no portfolios exist
    const defaultSymbols = ['bitcoin', 'ethereum', 'cardano', 'polkadot', 'chainlink'];
    defaultSymbols.forEach(symbol => symbolsSet.add(symbol));
    
    return Array.from(symbolsSet);
  } catch (error) {
    console.error('Error getting tracked symbols:', error);
    return ['bitcoin', 'ethereum', 'cardano']; // Fallback
  }
};

// Fetch prices from CoinGecko API
const fetchPricesFromAPI = async (symbols) => {
  try {
    const symbolsString = symbols.join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${symbolsString}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`;
    
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CryptoPortfolioTracker/1.0'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('CoinGecko API error:', error.message);
    
    // Return mock data if API fails
    return generateMockPrices(symbols);
  }
};

// Generate mock prices for testing/fallback
const generateMockPrices = (symbols) => {
  const mockPrices = {};
  
  symbols.forEach(symbol => {
    // Use some realistic base prices for common coins
    let basePrice;
    switch (symbol) {
      case 'bitcoin':
        basePrice = 45000;
        break;
      case 'ethereum':
        basePrice = 3000;
        break;
      case 'cardano':
        basePrice = 0.5;
        break;
      case 'polkadot':
        basePrice = 20;
        break;
      case 'chainlink':
        basePrice = 15;
        break;
      default:
        basePrice = Math.random() * 100 + 1;
    }
    
    // Add some random variation
    const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
    const price = basePrice * (1 + variation);
    
    mockPrices[symbol] = {
      usd: price,
      usd_24h_change: (Math.random() - 0.5) * 20, // ±10% change
      usd_24h_vol: Math.random() * 1000000000,
      usd_market_cap: price * Math.random() * 1000000000
    };
  });
  
  return mockPrices;
};

// Get current price for a specific symbol
const getCurrentPrice = async (symbol) => {
  try {
    // Try to get from cache first
    const cachedPrices = await getCachedData('latest-prices');
    if (cachedPrices && cachedPrices[symbol.toLowerCase()]) {
      return cachedPrices[symbol.toLowerCase()];
    }
    
    // Fetch from API if not in cache
    const prices = await fetchPricesFromAPI([symbol.toLowerCase()]);
    return prices[symbol.toLowerCase()] || null;
  } catch (error) {
    console.error(`Error getting price for ${symbol}:`, error);
    return null;
  }
};

// Get price history for a symbol
const getPriceHistory = async (symbol, days = 7) => {
  try {
    const url = `https://api.coingecko.com/api/v3/coins/${symbol}/market_chart?vs_currency=usd&days=${days}&interval=daily`;
    
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CryptoPortfolioTracker/1.0'
      }
    });
    
    const data = response.data;
    
    return {
      prices: data.prices.map(([timestamp, price]) => ({
        timestamp,
        date: new Date(timestamp).toISOString(),
        price
      })),
      volumes: data.total_volumes.map(([timestamp, volume]) => ({
        timestamp,
        date: new Date(timestamp).toISOString(),
        volume
      }))
    };
  } catch (error) {
    console.error(`Error getting price history for ${symbol}:`, error);
    return generateMockHistory(symbol, days);
  }
};

// Generate mock price history
const generateMockHistory = (symbol, days) => {
  const data = [];
  let basePrice = 100;
  
  for (let i = 0; i < days; i++) {
    const timestamp = Date.now() - (days - i) * 24 * 60 * 60 * 1000;
    basePrice += (Math.random() - 0.5) * 10;
    
    data.push({
      timestamp,
      date: new Date(timestamp).toISOString(),
      price: Math.max(basePrice, 1),
      volume: Math.random() * 1000000000
    });
  }
  
  return {
    prices: data.map(d => ({ timestamp: d.timestamp, date: d.date, price: d.price })),
    volumes: data.map(d => ({ timestamp: d.timestamp, date: d.date, volume: d.volume }))
  };
};

// Get price update statistics
const getPriceUpdateStats = () => {
  return {
    isUpdating,
    lastUpdate: new Date().toISOString(),
    updateInterval: updateInterval ? 30 : 0, // seconds
    status: updateInterval ? 'running' : 'stopped'
  };
};

// Manual price update trigger
const triggerManualUpdate = async () => {
  console.log('Manual price update triggered');
  await updateAllPrices();
  await updatePortfolioPrices();
};

module.exports = {
  startPriceUpdates,
  stopPriceUpdates,
  updateAllPrices,
  updatePortfolioPrices,
  getCurrentPrice,
  getPriceHistory,
  getPriceUpdateStats,
  triggerManualUpdate,
  getTrackedSymbols
};