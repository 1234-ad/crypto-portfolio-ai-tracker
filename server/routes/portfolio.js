const express = require('express');
const router = express.Router();
const Portfolio = require('../models/Portfolio');
const { validatePortfolioData } = require('../middleware/validation');

// Get user portfolio
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id || 'demo-user'; // For demo purposes
    const portfolio = await Portfolio.findOne({ userId }) || { holdings: [] };
    
    res.json({
      success: true,
      data: portfolio.holdings || []
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch portfolio'
    });
  }
});

// Add holding to portfolio
router.post('/holdings', validatePortfolioData, async (req, res) => {
  try {
    const userId = req.user?.id || 'demo-user';
    const { symbol, name, amount, purchasePrice } = req.body;
    
    let portfolio = await Portfolio.findOne({ userId });
    
    if (!portfolio) {
      portfolio = new Portfolio({
        userId,
        holdings: []
      });
    }
    
    // Check if holding already exists
    const existingHolding = portfolio.holdings.find(h => h.symbol === symbol);
    
    if (existingHolding) {
      // Update existing holding
      existingHolding.amount += parseFloat(amount);
      existingHolding.averagePurchasePrice = (
        (existingHolding.averagePurchasePrice * existingHolding.amount + 
         parseFloat(purchasePrice) * parseFloat(amount)) /
        (existingHolding.amount + parseFloat(amount))
      );
    } else {
      // Add new holding
      portfolio.holdings.push({
        symbol: symbol.toUpperCase(),
        name,
        amount: parseFloat(amount),
        purchasePrice: parseFloat(purchasePrice),
        averagePurchasePrice: parseFloat(purchasePrice),
        addedAt: new Date()
      });
    }
    
    await portfolio.save();
    
    res.json({
      success: true,
      message: 'Holding added successfully',
      data: portfolio.holdings
    });
  } catch (error) {
    console.error('Error adding holding:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add holding'
    });
  }
});

// Update holding
router.put('/holdings/:id', validatePortfolioData, async (req, res) => {
  try {
    const userId = req.user?.id || 'demo-user';
    const holdingId = req.params.id;
    const { amount, purchasePrice } = req.body;
    
    const portfolio = await Portfolio.findOne({ userId });
    
    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }
    
    const holding = portfolio.holdings.id(holdingId);
    
    if (!holding) {
      return res.status(404).json({
        success: false,
        message: 'Holding not found'
      });
    }
    
    if (amount !== undefined) holding.amount = parseFloat(amount);
    if (purchasePrice !== undefined) {
      holding.purchasePrice = parseFloat(purchasePrice);
      holding.averagePurchasePrice = parseFloat(purchasePrice);
    }
    
    holding.updatedAt = new Date();
    
    await portfolio.save();
    
    res.json({
      success: true,
      message: 'Holding updated successfully',
      data: portfolio.holdings
    });
  } catch (error) {
    console.error('Error updating holding:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update holding'
    });
  }
});

// Delete holding
router.delete('/holdings/:id', async (req, res) => {
  try {
    const userId = req.user?.id || 'demo-user';
    const holdingId = req.params.id;
    
    const portfolio = await Portfolio.findOne({ userId });
    
    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }
    
    portfolio.holdings.id(holdingId).remove();
    await portfolio.save();
    
    res.json({
      success: true,
      message: 'Holding deleted successfully',
      data: portfolio.holdings
    });
  } catch (error) {
    console.error('Error deleting holding:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete holding'
    });
  }
});

// Get portfolio summary
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user?.id || 'demo-user';
    const portfolio = await Portfolio.findOne({ userId });
    
    if (!portfolio || !portfolio.holdings.length) {
      return res.json({
        success: true,
        data: {
          totalValue: 0,
          totalHoldings: 0,
          topPerformer: null,
          worstPerformer: null
        }
      });
    }
    
    // Calculate portfolio metrics
    let totalValue = 0;
    let bestPerformance = -Infinity;
    let worstPerformance = Infinity;
    let topPerformer = null;
    let worstPerformer = null;
    
    for (const holding of portfolio.holdings) {
      const currentValue = holding.amount * (holding.currentPrice || holding.purchasePrice);
      totalValue += currentValue;
      
      const performance = ((holding.currentPrice || holding.purchasePrice) - holding.averagePurchasePrice) / holding.averagePurchasePrice;
      
      if (performance > bestPerformance) {
        bestPerformance = performance;
        topPerformer = holding;
      }
      
      if (performance < worstPerformance) {
        worstPerformance = performance;
        worstPerformer = holding;
      }
    }
    
    res.json({
      success: true,
      data: {
        totalValue,
        totalHoldings: portfolio.holdings.length,
        topPerformer: topPerformer ? {
          symbol: topPerformer.symbol,
          performance: (bestPerformance * 100).toFixed(2)
        } : null,
        worstPerformer: worstPerformer ? {
          symbol: worstPerformer.symbol,
          performance: (worstPerformance * 100).toFixed(2)
        } : null
      }
    });
  } catch (error) {
    console.error('Error getting portfolio summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get portfolio summary'
    });
  }
});

module.exports = router;