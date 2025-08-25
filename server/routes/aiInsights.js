const express = require('express');
const router = express.Router();
const aiInsightsService = require('../services/aiInsights');
const Portfolio = require('../models/Portfolio');
const { getCachedData, setCachedData } = require('../services/cache');

// Generate portfolio analysis
router.post('/portfolio-analysis', async (req, res) => {
  try {
    const userId = req.user?.id || 'demo-user';
    const cacheKey = `portfolio-analysis-${userId}`;
    
    // Check cache first (5 minutes)
    const cachedAnalysis = await getCachedData(cacheKey);
    if (cachedAnalysis) {
      return res.json({
        success: true,
        data: cachedAnalysis,
        cached: true
      });
    }
    
    const portfolio = await Portfolio.findOne({ userId });
    
    if (!portfolio || !portfolio.holdings.length) {
      return res.status(400).json({
        success: false,
        message: 'No portfolio data found'
      });
    }
    
    // Get market data for portfolio holdings
    const marketData = await getMarketDataForHoldings(portfolio.holdings);
    
    const analysis = await aiInsightsService.generatePortfolioAnalysis(
      portfolio.holdings,
      marketData
    );
    
    // Cache the result
    await setCachedData(cacheKey, analysis, 300); // 5 minutes
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error generating portfolio analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate portfolio analysis'
    });
  }
});

// Generate market sentiment analysis
router.post('/market-sentiment', async (req, res) => {
  try {
    const { symbols } = req.body;
    
    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({
        success: false,
        message: 'Symbols array is required'
      });
    }
    
    const cacheKey = `market-sentiment-${symbols.join('-')}`;
    
    // Check cache first (10 minutes)
    const cachedSentiment = await getCachedData(cacheKey);
    if (cachedSentiment) {
      return res.json({
        success: true,
        data: cachedSentiment,
        cached: true
      });
    }
    
    const sentiment = await aiInsightsService.generateMarketSentiment(symbols);
    
    // Cache the result
    await setCachedData(cacheKey, sentiment, 600); // 10 minutes
    
    res.json({
      success: true,
      data: sentiment
    });
  } catch (error) {
    console.error('Error generating market sentiment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate market sentiment'
    });
  }
});

// Generate price predictions
router.post('/price-predictions', async (req, res) => {
  try {
    const { symbol } = req.body;
    
    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: 'Symbol is required'
      });
    }
    
    const cacheKey = `price-prediction-${symbol}`;
    
    // Check cache first (30 minutes)
    const cachedPrediction = await getCachedData(cacheKey);
    if (cachedPrediction) {
      return res.json({
        success: true,
        data: cachedPrediction,
        cached: true
      });
    }
    
    // Get historical data for the symbol
    const coinData = await getHistoricalData(symbol);
    
    const prediction = await aiInsightsService.generatePricePrediction(coinData);
    
    // Cache the result
    await setCachedData(cacheKey, prediction, 1800); // 30 minutes
    
    res.json({
      success: true,
      data: prediction
    });
  } catch (error) {
    console.error('Error generating price prediction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate price prediction'
    });
  }
});

// Get AI insights summary
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user?.id || 'demo-user';
    const portfolio = await Portfolio.findOne({ userId });
    
    if (!portfolio || !portfolio.holdings.length) {
      return res.json({
        success: true,
        data: {
          hasPortfolio: false,
          message: 'Add holdings to your portfolio to get AI insights'
        }
      });
    }
    
    const symbols = portfolio.holdings.map(h => h.symbol);
    
    // Get cached insights if available
    const portfolioAnalysisKey = `portfolio-analysis-${userId}`;
    const sentimentKey = `market-sentiment-${symbols.join('-')}`;
    
    const [portfolioAnalysis, marketSentiment] = await Promise.all([
      getCachedData(portfolioAnalysisKey),
      getCachedData(sentimentKey)
    ]);
    
    res.json({
      success: true,
      data: {
        hasPortfolio: true,
        portfolioAnalysis: portfolioAnalysis || null,
        marketSentiment: marketSentiment || null,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting AI insights summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get AI insights summary'
    });
  }
});

// Helper functions
async function getMarketDataForHoldings(holdings) {
  // Mock implementation - in real app, fetch from CoinGecko or similar
  return holdings.map(holding => ({
    symbol: holding.symbol,
    currentPrice: holding.currentPrice || holding.purchasePrice * (1 + Math.random() * 0.2 - 0.1),
    priceChange24h: Math.random() * 20 - 10,
    volume24h: Math.random() * 1000000000,
    marketCap: Math.random() * 100000000000
  }));
}

async function getHistoricalData(symbol) {
  // Mock implementation - in real app, fetch historical data
  const days = 30;
  const data = [];
  let basePrice = 100;
  
  for (let i = 0; i < days; i++) {
    basePrice += (Math.random() - 0.5) * 10;
    data.push({
      date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString(),
      price: Math.max(basePrice, 1),
      volume: Math.random() * 1000000
    });
  }
  
  return {
    symbol,
    data,
    currentPrice: data[data.length - 1].price,
    priceChange: ((data[data.length - 1].price - data[0].price) / data[0].price) * 100
  };
}

module.exports = router;