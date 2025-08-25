const axios = require('axios');
const { getCachedData, setCachedData } = require('./cache');

class MarketDataService {
  constructor() {
    this.baseURL = 'https://api.coingecko.com/api/v3';
    this.timeout = 15000;
    this.retryAttempts = 3;
    this.retryDelay = 1000;
  }

  // Get prices for multiple symbols
  async getPricesForSymbols(symbols) {
    const cacheKey = `prices-${symbols.sort().join('-')}`;
    
    // Check cache first
    const cachedPrices = await getCachedData(cacheKey);
    if (cachedPrices) {
      return cachedPrices;
    }

    try {
      const symbolsString = symbols.join(',');
      const url = `${this.baseURL}/simple/price?ids=${symbolsString}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`;
      
      const response = await this.makeRequest(url);
      
      // Cache for 1 minute
      await setCachedData(cacheKey, response.data, 60);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching prices:', error.message);
      return this.generateMockPrices(symbols);
    }
  }

  // Get detailed coin information
  async getCoinDetails(coinId) {
    const cacheKey = `coin-details-${coinId}`;
    
    // Check cache first (5 minutes)
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const url = `${this.baseURL}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`;
      
      const response = await this.makeRequest(url);
      const data = response.data;
      
      const coinDetails = {
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
        atlDate: data.market_data?.atl_date?.usd,
        description: data.description?.en
      };
      
      // Cache for 5 minutes
      await setCachedData(cacheKey, coinDetails, 300);
      
      return coinDetails;
    } catch (error) {
      console.error(`Error fetching coin details for ${coinId}:`, error.message);
      return this.generateMockCoinDetails(coinId);
    }
  }

  // Get historical price data
  async getHistoricalData(coinId, days = 7) {
    const cacheKey = `historical-${coinId}-${days}`;
    
    // Check cache first (30 minutes)
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const interval = days <= 1 ? 'hourly' : days <= 90 ? 'daily' : 'weekly';
      const url = `${this.baseURL}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=${interval}`;
      
      const response = await this.makeRequest(url);
      const data = response.data;
      
      const historicalData = {
        prices: data.prices.map(([timestamp, price]) => ({
          timestamp,
          date: new Date(timestamp).toISOString(),
          price: parseFloat(price.toFixed(8))
        })),
        volumes: data.total_volumes.map(([timestamp, volume]) => ({
          timestamp,
          date: new Date(timestamp).toISOString(),
          volume: parseFloat(volume.toFixed(2))
        })),
        marketCaps: data.market_caps.map(([timestamp, marketCap]) => ({
          timestamp,
          date: new Date(timestamp).toISOString(),
          marketCap: parseFloat(marketCap.toFixed(2))
        }))
      };
      
      // Cache for 30 minutes
      await setCachedData(cacheKey, historicalData, 1800);
      
      return historicalData;
    } catch (error) {
      console.error(`Error fetching historical data for ${coinId}:`, error.message);
      return this.generateMockHistoricalData(coinId, days);
    }
  }

  // Get trending coins
  async getTrendingCoins() {
    const cacheKey = 'trending-coins';
    
    // Check cache first (10 minutes)
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const url = `${this.baseURL}/search/trending`;
      
      const response = await this.makeRequest(url);
      
      const trending = response.data.coins.map(coin => ({
        id: coin.item.id,
        name: coin.item.name,
        symbol: coin.item.symbol,
        marketCapRank: coin.item.market_cap_rank,
        thumb: coin.item.thumb,
        score: coin.item.score
      }));
      
      // Cache for 10 minutes
      await setCachedData(cacheKey, trending, 600);
      
      return trending;
    } catch (error) {
      console.error('Error fetching trending coins:', error.message);
      return this.generateMockTrending();
    }
  }

  // Get global market data
  async getGlobalMarketData() {
    const cacheKey = 'global-market-data';
    
    // Check cache first (5 minutes)
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const url = `${this.baseURL}/global`;
      
      const response = await this.makeRequest(url);
      const data = response.data.data;
      
      const globalData = {
        totalMarketCap: data.total_market_cap?.usd,
        totalVolume: data.total_volume?.usd,
        marketCapPercentage: data.market_cap_percentage,
        activeCryptocurrencies: data.active_cryptocurrencies,
        markets: data.markets,
        marketCapChange24h: data.market_cap_change_percentage_24h_usd,
        btcDominance: data.market_cap_percentage?.btc,
        ethDominance: data.market_cap_percentage?.eth
      };
      
      // Cache for 5 minutes
      await setCachedData(cacheKey, globalData, 300);
      
      return globalData;
    } catch (error) {
      console.error('Error fetching global market data:', error.message);
      return this.generateMockGlobalData();
    }
  }

  // Get top cryptocurrencies by market cap
  async getTopCoins(limit = 100) {
    const cacheKey = `top-coins-${limit}`;
    
    // Check cache first (5 minutes)
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const url = `${this.baseURL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=1h,24h,7d`;
      
      const response = await this.makeRequest(url);
      
      const topCoins = response.data.map(coin => ({
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        image: coin.image,
        currentPrice: coin.current_price,
        marketCap: coin.market_cap,
        marketCapRank: coin.market_cap_rank,
        totalVolume: coin.total_volume,
        priceChange1h: coin.price_change_percentage_1h_in_currency,
        priceChange24h: coin.price_change_percentage_24h,
        priceChange7d: coin.price_change_percentage_7d_in_currency,
        circulatingSupply: coin.circulating_supply,
        totalSupply: coin.total_supply,
        maxSupply: coin.max_supply,
        ath: coin.ath,
        athDate: coin.ath_date,
        atl: coin.atl,
        atlDate: coin.atl_date,
        lastUpdated: coin.last_updated
      }));
      
      // Cache for 5 minutes
      await setCachedData(cacheKey, topCoins, 300);
      
      return topCoins;
    } catch (error) {
      console.error('Error fetching top coins:', error.message);
      return this.generateMockTopCoins(limit);
    }
  }

  // Search for coins
  async searchCoins(query) {
    const cacheKey = `search-${query.toLowerCase()}`;
    
    // Check cache first (30 minutes)
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const url = `${this.baseURL}/search?query=${encodeURIComponent(query)}`;
      
      const response = await this.makeRequest(url);
      
      const searchResults = {
        coins: response.data.coins.map(coin => ({
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol,
          marketCapRank: coin.market_cap_rank,
          thumb: coin.thumb,
          large: coin.large
        })),
        exchanges: response.data.exchanges.map(exchange => ({
          id: exchange.id,
          name: exchange.name,
          marketType: exchange.market_type,
          thumb: exchange.thumb,
          large: exchange.large
        }))
      };
      
      // Cache for 30 minutes
      await setCachedData(cacheKey, searchResults, 1800);
      
      return searchResults;
    } catch (error) {
      console.error(`Error searching for "${query}":`, error.message);
      return { coins: [], exchanges: [] };
    }
  }

  // Make HTTP request with retry logic
  async makeRequest(url, retryCount = 0) {
    try {
      const response = await axios.get(url, {
        timeout: this.timeout,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CryptoPortfolioTracker/1.0'
        }
      });
      
      return response;
    } catch (error) {
      if (retryCount < this.retryAttempts && this.shouldRetry(error)) {
        console.log(`Retrying request (${retryCount + 1}/${this.retryAttempts}): ${url}`);
        await this.delay(this.retryDelay * (retryCount + 1));
        return this.makeRequest(url, retryCount + 1);
      }
      
      throw error;
    }
  }

  // Check if error should trigger a retry
  shouldRetry(error) {
    if (!error.response) return true; // Network error
    
    const status = error.response.status;
    return status >= 500 || status === 429; // Server error or rate limit
  }

  // Delay helper for retries
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Mock data generators for fallback
  generateMockPrices(symbols) {
    const mockPrices = {};
    
    symbols.forEach(symbol => {
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
        default:
          basePrice = Math.random() * 100 + 1;
      }
      
      const variation = (Math.random() - 0.5) * 0.1;
      const price = basePrice * (1 + variation);
      
      mockPrices[symbol] = {
        usd: price,
        usd_24h_change: (Math.random() - 0.5) * 20,
        usd_24h_vol: Math.random() * 1000000000,
        usd_market_cap: price * Math.random() * 1000000000
      };
    });
    
    return mockPrices;
  }

  generateMockCoinDetails(coinId) {
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
      priceChange30d: (Math.random() - 0.5) * 80,
      description: `${coinId} is a cryptocurrency project focused on innovation and decentralization.`
    };
  }

  generateMockHistoricalData(coinId, days) {
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

  generateMockTrending() {
    return [
      { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', marketCapRank: 1, score: 0 },
      { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', marketCapRank: 2, score: 1 },
      { id: 'cardano', name: 'Cardano', symbol: 'ADA', marketCapRank: 8, score: 2 }
    ];
  }

  generateMockGlobalData() {
    return {
      totalMarketCap: 2500000000000,
      totalVolume: 100000000000,
      marketCapPercentage: { btc: 45, eth: 18 },
      activeCryptocurrencies: 10000,
      markets: 800,
      marketCapChange24h: 2.5,
      btcDominance: 45,
      ethDominance: 18
    };
  }

  generateMockTopCoins(limit) {
    const coins = [];
    const names = ['Bitcoin', 'Ethereum', 'Cardano', 'Polkadot', 'Chainlink', 'Litecoin', 'Stellar', 'Dogecoin'];
    
    for (let i = 0; i < Math.min(limit, names.length); i++) {
      coins.push({
        id: names[i].toLowerCase(),
        symbol: names[i].slice(0, 3).toUpperCase(),
        name: names[i],
        currentPrice: Math.random() * 1000 + 10,
        marketCap: Math.random() * 100000000000,
        marketCapRank: i + 1,
        totalVolume: Math.random() * 10000000000,
        priceChange24h: (Math.random() - 0.5) * 20,
        priceChange7d: (Math.random() - 0.5) * 40
      });
    }
    
    return coins;
  }
}

module.exports = new MarketDataService();