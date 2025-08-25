const express = require('express');
const router = express.Router();
const axios = require('axios');
const { getCachedData, setCachedData } = require('../services/cache');

// Get current prices for multiple coins
router.get('/prices', async (req, res) => {
  try {
    const { symbols } = req.query;
    
    if (!symbols) {
      return res.status(400).json({
        success: false,
        message: 'Symbols parameter is required'
      });
    }
    
    const symbolsArray = symbols.split(',').map(s => s.trim().toLowerCase());
    const cacheKey = `prices-${symbolsArray.join('-')}`;
    
    // Check cache first (1 minute)
    const cachedPrices = await getCachedData(cacheKey);
    if (cachedPrices) {
      return res.json({
        success: true,
        data: cachedPrices,
        cached: true
      });
    }
    
    // Fetch from CoinGecko API
    const prices = await fetchPricesFromCoinGecko(symbolsArray);
    
    // Cache the result
    await setCachedData(cacheKey, prices, 60); // 1 minute
    
    res.json({
      success: true,
      data: prices
    });
  } catch (error) {
    console.error('Error fetching prices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prices'
    });
  }
});

// Get detailed market data for a specific coin
router.get('/coin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `coin-data-${id}`;
    
    // Check cache first (5 minutes)
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        cached: true
      });
    }
    
    const coinData = await fetchCoinDataFromCoinGecko(id);
    
    // Cache the result
    await setCachedData(cacheKey, coinData, 300); // 5 minutes
    
    res.json({
      success: true,
      data: coinData
    });
  } catch (error) {
    console.error('Error fetching coin data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coin data'
    });
  }
});

// Get trending coins
router.get('/trending', async (req, res) => {
  try {
    const cacheKey = 'trending-coins';
    
    // Check cache first (10 minutes)
    const cachedTrending = await getCachedData(cacheKey);
    if (cachedTrending) {
      return res.json({
        success: true,
        data: cachedTrending,
        cached: true
      });
    }
    
    const trending = await fetchTrendingFromCoinGecko();
    
    // Cache the result
    await setCachedData(cacheKey, trending, 600); // 10 minutes
    
    res.json({
      success: true,
      data: trending
    });
  } catch (error) {
    console.error('Error fetching trending coins:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending coins'
    });
  }
});

// Get market overview
router.get('/overview', async (req, res) => {
  try {
    const cacheKey = 'market-overview';
    
    // Check cache first (5 minutes)
    const cachedOverview = await getCachedData(cacheKey);
    if (cachedOverview) {
      return res.json({
        success: true,
        data: cachedOverview,
        cached: true
      });
    }
    
    const overview = await fetchMarketOverview();
    
    // Cache the result
    await setCachedData(cacheKey, overview, 300); // 5 minutes
    
    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    console.error('Error fetching market overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch market overview'
    });
  }
});

// Get historical data for a coin
router.get('/history/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 7 } = req.query;
    const cacheKey = `history-${id}-${days}`;
    
    // Check cache first (30 minutes)
    const cachedHistory = await getCachedData(cacheKey);
    if (cachedHistory) {
      return res.json({
        success: true,
        data: cachedHistory,
        cached: true
      });
    }
    
    const history = await fetchHistoricalData(id, days);
    
    // Cache the result
    await setCachedData(cacheKey, history, 1800); // 30 minutes
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error fetching historical data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch historical data'
    });
  }
});

// Helper functions for API calls
async function fetchPricesFromCoinGecko(symbols) {
  try {
    const symbolsString = symbols.join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${symbolsString}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`;
    
    const response = await axios.get(url, {
      timeout: 10000,
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
}

async function fetchCoinDataFromCoinGecko(coinId) {
  try {
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`;
    
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CryptoPortfolioTracker/1.0'
      }
    });
    
    const data = response.data;
    
    return {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      image: data.image?.large,
      currentPrice: data.market_data?.current_price?.usd,
      marketCap: data.market_data?.market_cap?.usd,
      marketCapRank: data.market_data?.market_cap_rank,
      totalVolume: data.market_data?.total_volume?.usd,
      priceChange24h: data.market_data?.price_change_percentage_24h,
      priceChange7d: data.market_data?.price_change_percentage_7d,
      priceChange30d: data.market_data?.price_change_percentage_30d,
      circulatingSupply: data.market_data?.circulating_supply,
      totalSupply: data.market_data?.total_supply,
      maxSupply: data.market_data?.max_supply,
      ath: data.market_data?.ath?.usd,
      athDate: data.market_data?.ath_date?.usd,
      atl: data.market_data?.atl?.usd,
      atlDate: data.market_data?.atl_date?.usd
    };
  } catch (error) {
    console.error('CoinGecko coin data error:', error.message);
    return generateMockCoinData(coinId);
  }
}

async function fetchTrendingFromCoinGecko() {
  try {
    const url = 'https://api.coingecko.com/api/v3/search/trending';
    
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CryptoPortfolioTracker/1.0'
      }
    });
    
    return response.data.coins.map(coin => ({
      id: coin.item.id,
      name: coin.item.name,
      symbol: coin.item.symbol,
      marketCapRank: coin.item.market_cap_rank,
      thumb: coin.item.thumb,
      score: coin.item.score
    }));
  } catch (error) {
    console.error('CoinGecko trending error:', error.message);
    return generateMockTrending();
  }
}

async function fetchMarketOverview() {
  try {
    const url = 'https://api.coingecko.com/api/v3/global';
    
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CryptoPortfolioTracker/1.0'
      }
    });
    
    const data = response.data.data;
    
    return {
      totalMarketCap: data.total_market_cap?.usd,
      totalVolume: data.total_volume?.usd,
      marketCapPercentage: data.market_cap_percentage,
      activeCryptocurrencies: data.active_cryptocurrencies,
      markets: data.markets,
      marketCapChange24h: data.market_cap_change_percentage_24h_usd
    };
  } catch (error) {
    console.error('CoinGecko global data error:', error.message);
    return generateMockOverview();
  }
}

async function fetchHistoricalData(coinId, days) {
  try {
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=daily`;
    
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
      })),
      marketCaps: data.market_caps.map(([timestamp, marketCap]) => ({
        timestamp,
        date: new Date(timestamp).toISOString(),
        marketCap
      }))
    };
  } catch (error) {
    console.error('CoinGecko historical data error:', error.message);
    return generateMockHistoricalData(coinId, days);
  }
}

// Mock data generators for fallback
function generateMockPrices(symbols) {
  const mockPrices = {};
  symbols.forEach(symbol => {
    mockPrices[symbol] = {
      usd: Math.random() * 1000 + 100,
      usd_24h_change: (Math.random() - 0.5) * 20,
      usd_24h_vol: Math.random() * 1000000000
    };
  });
  return mockPrices;
}

function generateMockCoinData(coinId) {
  return {
    id: coinId,
    symbol: coinId.slice(0, 3).toUpperCase(),
    name: coinId.charAt(0).toUpperCase() + coinId.slice(1),
    currentPrice: Math.random() * 1000 + 100,
    marketCap: Math.random() * 100000000000,
    marketCapRank: Math.floor(Math.random() * 100) + 1,
    totalVolume: Math.random() * 10000000000,
    priceChange24h: (Math.random() - 0.5) * 20,
    priceChange7d: (Math.random() - 0.5) * 40,
    priceChange30d: (Math.random() - 0.5) * 80
  };
}

function generateMockTrending() {
  return [
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', marketCapRank: 1, score: 0 },
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', marketCapRank: 2, score: 1 },
    { id: 'cardano', name: 'Cardano', symbol: 'ADA', marketCapRank: 8, score: 2 }
  ];
}

function generateMockOverview() {
  return {
    totalMarketCap: 2500000000000,
    totalVolume: 100000000000,
    marketCapPercentage: { btc: 45, eth: 18 },
    activeCryptocurrencies: 10000,
    markets: 800,
    marketCapChange24h: 2.5
  };
}

function generateMockHistoricalData(coinId, days) {
  const data = [];
  let basePrice = 100;
  
  for (let i = 0; i < parseInt(days); i++) {
    const timestamp = Date.now() - (parseInt(days) - i) * 24 * 60 * 60 * 1000;
    basePrice += (Math.random() - 0.5) * 10;
    
    data.push({
      timestamp,
      date: new Date(timestamp).toISOString(),
      price: Math.max(basePrice, 1),
      volume: Math.random() * 1000000000,
      marketCap: Math.max(basePrice, 1) * Math.random() * 1000000000
    });
  }
  
  return {
    prices: data.map(d => ({ timestamp: d.timestamp, date: d.date, price: d.price })),
    volumes: data.map(d => ({ timestamp: d.timestamp, date: d.date, volume: d.volume })),
    marketCaps: data.map(d => ({ timestamp: d.timestamp, date: d.date, marketCap: d.marketCap }))
  };
}

module.exports = router;