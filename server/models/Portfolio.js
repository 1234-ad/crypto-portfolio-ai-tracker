const mongoose = require('mongoose');

const holdingSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  purchasePrice: {
    type: Number,
    required: true,
    min: 0
  },
  averagePurchasePrice: {
    type: Number,
    required: true,
    min: 0
  },
  currentPrice: {
    type: Number,
    default: 0
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    maxlength: 500
  },
  tags: [{
    type: String,
    trim: true
  }]
});

// Virtual for current value
holdingSchema.virtual('currentValue').get(function() {
  return this.amount * (this.currentPrice || this.purchasePrice);
});

// Virtual for profit/loss
holdingSchema.virtual('profitLoss').get(function() {
  const currentValue = this.amount * (this.currentPrice || this.purchasePrice);
  const purchaseValue = this.amount * this.averagePurchasePrice;
  return currentValue - purchaseValue;
});

// Virtual for profit/loss percentage
holdingSchema.virtual('profitLossPercentage').get(function() {
  const currentPrice = this.currentPrice || this.purchasePrice;
  return ((currentPrice - this.averagePurchasePrice) / this.averagePurchasePrice) * 100;
});

const portfolioSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  holdings: [holdingSchema],
  totalInvested: {
    type: Number,
    default: 0
  },
  totalCurrentValue: {
    type: Number,
    default: 0
  },
  totalProfitLoss: {
    type: Number,
    default: 0
  },
  totalProfitLossPercentage: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  settings: {
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'JPY', 'BTC', 'ETH']
    },
    notifications: {
      priceAlerts: {
        type: Boolean,
        default: true
      },
      portfolioUpdates: {
        type: Boolean,
        default: true
      },
      aiInsights: {
        type: Boolean,
        default: false
      }
    },
    privacy: {
      sharePortfolio: {
        type: Boolean,
        default: false
      },
      publicProfile: {
        type: Boolean,
        default: false
      }
    }
  },
  metadata: {
    createdAt: {
      type: Date,
      default: Date.now
    },
    lastLogin: {
      type: Date,
      default: Date.now
    },
    version: {
      type: String,
      default: '1.0.0'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
portfolioSchema.index({ userId: 1 });
portfolioSchema.index({ 'holdings.symbol': 1 });
portfolioSchema.index({ lastUpdated: -1 });

// Virtual for total portfolio metrics
portfolioSchema.virtual('portfolioMetrics').get(function() {
  if (!this.holdings || this.holdings.length === 0) {
    return {
      totalInvested: 0,
      totalCurrentValue: 0,
      totalProfitLoss: 0,
      totalProfitLossPercentage: 0,
      holdingsCount: 0
    };
  }

  let totalInvested = 0;
  let totalCurrentValue = 0;

  this.holdings.forEach(holding => {
    totalInvested += holding.amount * holding.averagePurchasePrice;
    totalCurrentValue += holding.amount * (holding.currentPrice || holding.purchasePrice);
  });

  const totalProfitLoss = totalCurrentValue - totalInvested;
  const totalProfitLossPercentage = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

  return {
    totalInvested,
    totalCurrentValue,
    totalProfitLoss,
    totalProfitLossPercentage,
    holdingsCount: this.holdings.length
  };
});

// Method to update portfolio metrics
portfolioSchema.methods.updateMetrics = function() {
  const metrics = this.portfolioMetrics;
  this.totalInvested = metrics.totalInvested;
  this.totalCurrentValue = metrics.totalCurrentValue;
  this.totalProfitLoss = metrics.totalProfitLoss;
  this.totalProfitLossPercentage = metrics.totalProfitLossPercentage;
  this.lastUpdated = new Date();
};

// Method to add or update holding
portfolioSchema.methods.addOrUpdateHolding = function(holdingData) {
  const existingHolding = this.holdings.find(h => h.symbol === holdingData.symbol.toUpperCase());
  
  if (existingHolding) {
    // Update existing holding with average price calculation
    const totalAmount = existingHolding.amount + holdingData.amount;
    const totalValue = (existingHolding.amount * existingHolding.averagePurchasePrice) + 
                     (holdingData.amount * holdingData.purchasePrice);
    
    existingHolding.amount = totalAmount;
    existingHolding.averagePurchasePrice = totalValue / totalAmount;
    existingHolding.updatedAt = new Date();
    
    if (holdingData.notes) existingHolding.notes = holdingData.notes;
    if (holdingData.tags) existingHolding.tags = holdingData.tags;
  } else {
    // Add new holding
    this.holdings.push({
      symbol: holdingData.symbol.toUpperCase(),
      name: holdingData.name,
      amount: holdingData.amount,
      purchasePrice: holdingData.purchasePrice,
      averagePurchasePrice: holdingData.purchasePrice,
      notes: holdingData.notes || '',
      tags: holdingData.tags || []
    });
  }
  
  this.updateMetrics();
};

// Method to remove holding
portfolioSchema.methods.removeHolding = function(holdingId) {
  this.holdings.id(holdingId).remove();
  this.updateMetrics();
};

// Method to update current prices
portfolioSchema.methods.updatePrices = function(priceData) {
  this.holdings.forEach(holding => {
    const priceInfo = priceData[holding.symbol.toLowerCase()];
    if (priceInfo && priceInfo.usd) {
      holding.currentPrice = priceInfo.usd;
    }
  });
  
  this.updateMetrics();
};

// Method to get top performers
portfolioSchema.methods.getTopPerformers = function(limit = 3) {
  return this.holdings
    .filter(h => h.currentPrice > 0)
    .sort((a, b) => b.profitLossPercentage - a.profitLossPercentage)
    .slice(0, limit);
};

// Method to get worst performers
portfolioSchema.methods.getWorstPerformers = function(limit = 3) {
  return this.holdings
    .filter(h => h.currentPrice > 0)
    .sort((a, b) => a.profitLossPercentage - b.profitLossPercentage)
    .slice(0, limit);
};

// Method to get portfolio allocation
portfolioSchema.methods.getAllocation = function() {
  const totalValue = this.totalCurrentValue;
  
  if (totalValue === 0) return [];
  
  return this.holdings.map(holding => ({
    symbol: holding.symbol,
    name: holding.name,
    value: holding.currentValue,
    percentage: (holding.currentValue / totalValue) * 100
  })).sort((a, b) => b.percentage - a.percentage);
};

// Pre-save middleware to update metrics
portfolioSchema.pre('save', function(next) {
  if (this.isModified('holdings')) {
    this.updateMetrics();
  }
  next();
});

// Static method to find or create portfolio
portfolioSchema.statics.findOrCreatePortfolio = async function(userId) {
  let portfolio = await this.findOne({ userId });
  
  if (!portfolio) {
    portfolio = new this({
      userId,
      holdings: [],
      metadata: {
        createdAt: new Date(),
        lastLogin: new Date(),
        version: '1.0.0'
      }
    });
    await portfolio.save();
  }
  
  return portfolio;
};

module.exports = mongoose.model('Portfolio', portfolioSchema);