const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server/index');
const Portfolio = require('../server/models/Portfolio');

// Test database
const MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/crypto-tracker-test';

describe('Portfolio API', () => {
  beforeAll(async () => {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Portfolio.deleteMany({});
  });

  describe('GET /api/portfolio', () => {
    it('should return empty portfolio for new user', async () => {
      const response = await request(app)
        .get('/api/portfolio')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should return existing portfolio holdings', async () => {
      // Create test portfolio
      const portfolio = new Portfolio({
        userId: 'test-user',
        holdings: [{
          symbol: 'BTC',
          name: 'Bitcoin',
          amount: 1.5,
          purchasePrice: 40000,
          averagePurchasePrice: 40000
        }]
      });
      await portfolio.save();

      const response = await request(app)
        .get('/api/portfolio')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].symbol).toBe('BTC');
      expect(response.body.data[0].amount).toBe(1.5);
    });
  });

  describe('POST /api/portfolio/holdings', () => {
    it('should add new holding to portfolio', async () => {
      const holdingData = {
        symbol: 'ETH',
        name: 'Ethereum',
        amount: 10,
        purchasePrice: 2500
      };

      const response = await request(app)
        .post('/api/portfolio/holdings')
        .send(holdingData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].symbol).toBe('ETH');
      expect(response.body.data[0].amount).toBe(10);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        name: 'Bitcoin'
        // Missing symbol and amount
      };

      const response = await request(app)
        .post('/api/portfolio/holdings')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
    });

    it('should update existing holding when adding same symbol', async () => {
      // Create initial holding
      const portfolio = new Portfolio({
        userId: 'demo-user',
        holdings: [{
          symbol: 'BTC',
          name: 'Bitcoin',
          amount: 1,
          purchasePrice: 40000,
          averagePurchasePrice: 40000
        }]
      });
      await portfolio.save();

      // Add more of the same symbol
      const additionalHolding = {
        symbol: 'BTC',
        name: 'Bitcoin',
        amount: 0.5,
        purchasePrice: 50000
      };

      const response = await request(app)
        .post('/api/portfolio/holdings')
        .send(additionalHolding)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].amount).toBe(1.5);
      // Average price should be calculated
      expect(response.body.data[0].averagePurchasePrice).toBeCloseTo(43333.33, 2);
    });
  });

  describe('PUT /api/portfolio/holdings/:id', () => {
    it('should update existing holding', async () => {
      const portfolio = new Portfolio({
        userId: 'demo-user',
        holdings: [{
          symbol: 'BTC',
          name: 'Bitcoin',
          amount: 1,
          purchasePrice: 40000,
          averagePurchasePrice: 40000
        }]
      });
      await portfolio.save();

      const holdingId = portfolio.holdings[0]._id;
      const updateData = {
        amount: 2,
        purchasePrice: 45000
      };

      const response = await request(app)
        .put(`/api/portfolio/holdings/${holdingId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data[0].amount).toBe(2);
      expect(response.body.data[0].purchasePrice).toBe(45000);
    });

    it('should return 404 for non-existent holding', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/portfolio/holdings/${fakeId}`)
        .send({ amount: 1 })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Portfolio not found');
    });
  });

  describe('DELETE /api/portfolio/holdings/:id', () => {
    it('should delete existing holding', async () => {
      const portfolio = new Portfolio({
        userId: 'demo-user',
        holdings: [{
          symbol: 'BTC',
          name: 'Bitcoin',
          amount: 1,
          purchasePrice: 40000,
          averagePurchasePrice: 40000
        }]
      });
      await portfolio.save();

      const holdingId = portfolio.holdings[0]._id;

      const response = await request(app)
        .delete(`/api/portfolio/holdings/${holdingId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/portfolio/summary', () => {
    it('should return portfolio summary', async () => {
      const portfolio = new Portfolio({
        userId: 'demo-user',
        holdings: [
          {
            symbol: 'BTC',
            name: 'Bitcoin',
            amount: 1,
            purchasePrice: 40000,
            averagePurchasePrice: 40000,
            currentPrice: 45000
          },
          {
            symbol: 'ETH',
            name: 'Ethereum',
            amount: 10,
            purchasePrice: 2000,
            averagePurchasePrice: 2000,
            currentPrice: 2500
          }
        ]
      });
      await portfolio.save();

      const response = await request(app)
        .get('/api/portfolio/summary')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalValue).toBe(70000); // 45000 + 25000
      expect(response.body.data.totalHoldings).toBe(2);
      expect(response.body.data.topPerformer).toBeDefined();
      expect(response.body.data.worstPerformer).toBeDefined();
    });

    it('should return empty summary for no holdings', async () => {
      const response = await request(app)
        .get('/api/portfolio/summary')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalValue).toBe(0);
      expect(response.body.data.totalHoldings).toBe(0);
      expect(response.body.data.topPerformer).toBeNull();
      expect(response.body.data.worstPerformer).toBeNull();
    });
  });
});

describe('Portfolio Model', () => {
  beforeAll(async () => {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Portfolio.deleteMany({});
  });

  describe('Portfolio creation', () => {
    it('should create a new portfolio', async () => {
      const portfolioData = {
        userId: 'test-user',
        holdings: [{
          symbol: 'BTC',
          name: 'Bitcoin',
          amount: 1,
          purchasePrice: 40000,
          averagePurchasePrice: 40000
        }]
      };

      const portfolio = new Portfolio(portfolioData);
      await portfolio.save();

      expect(portfolio._id).toBeDefined();
      expect(portfolio.userId).toBe('test-user');
      expect(portfolio.holdings).toHaveLength(1);
    });

    it('should calculate portfolio metrics', async () => {
      const portfolio = new Portfolio({
        userId: 'test-user',
        holdings: [
          {
            symbol: 'BTC',
            name: 'Bitcoin',
            amount: 1,
            purchasePrice: 40000,
            averagePurchasePrice: 40000,
            currentPrice: 45000
          },
          {
            symbol: 'ETH',
            name: 'Ethereum',
            amount: 10,
            purchasePrice: 2000,
            averagePurchasePrice: 2000,
            currentPrice: 2500
          }
        ]
      });

      const metrics = portfolio.portfolioMetrics;

      expect(metrics.totalInvested).toBe(60000); // 40000 + 20000
      expect(metrics.totalCurrentValue).toBe(70000); // 45000 + 25000
      expect(metrics.totalProfitLoss).toBe(10000);
      expect(metrics.totalProfitLossPercentage).toBeCloseTo(16.67, 2);
      expect(metrics.holdingsCount).toBe(2);
    });
  });

  describe('Portfolio methods', () => {
    it('should add or update holding', async () => {
      const portfolio = new Portfolio({
        userId: 'test-user',
        holdings: []
      });

      // Add new holding
      portfolio.addOrUpdateHolding({
        symbol: 'BTC',
        name: 'Bitcoin',
        amount: 1,
        purchasePrice: 40000
      });

      expect(portfolio.holdings).toHaveLength(1);
      expect(portfolio.holdings[0].symbol).toBe('BTC');
      expect(portfolio.holdings[0].amount).toBe(1);

      // Update existing holding
      portfolio.addOrUpdateHolding({
        symbol: 'BTC',
        name: 'Bitcoin',
        amount: 0.5,
        purchasePrice: 50000
      });

      expect(portfolio.holdings).toHaveLength(1);
      expect(portfolio.holdings[0].amount).toBe(1.5);
      expect(portfolio.holdings[0].averagePurchasePrice).toBeCloseTo(43333.33, 2);
    });

    it('should get top performers', async () => {
      const portfolio = new Portfolio({
        userId: 'test-user',
        holdings: [
          {
            symbol: 'BTC',
            name: 'Bitcoin',
            amount: 1,
            purchasePrice: 40000,
            averagePurchasePrice: 40000,
            currentPrice: 50000 // +25%
          },
          {
            symbol: 'ETH',
            name: 'Ethereum',
            amount: 10,
            purchasePrice: 2000,
            averagePurchasePrice: 2000,
            currentPrice: 1800 // -10%
          }
        ]
      });

      const topPerformers = portfolio.getTopPerformers(1);
      expect(topPerformers).toHaveLength(1);
      expect(topPerformers[0].symbol).toBe('BTC');
    });

    it('should get portfolio allocation', async () => {
      const portfolio = new Portfolio({
        userId: 'test-user',
        holdings: [
          {
            symbol: 'BTC',
            name: 'Bitcoin',
            amount: 1,
            purchasePrice: 40000,
            averagePurchasePrice: 40000,
            currentPrice: 40000
          },
          {
            symbol: 'ETH',
            name: 'Ethereum',
            amount: 10,
            purchasePrice: 2000,
            averagePurchasePrice: 2000,
            currentPrice: 2000
          }
        ]
      });

      const allocation = portfolio.getAllocation();
      expect(allocation).toHaveLength(2);
      expect(allocation[0].percentage).toBeCloseTo(66.67, 2); // BTC: 40000/60000
      expect(allocation[1].percentage).toBeCloseTo(33.33, 2); // ETH: 20000/60000
    });
  });

  describe('Static methods', () => {
    it('should find or create portfolio', async () => {
      const userId = 'new-user';

      // Should create new portfolio
      const portfolio1 = await Portfolio.findOrCreatePortfolio(userId);
      expect(portfolio1.userId).toBe(userId);
      expect(portfolio1.holdings).toHaveLength(0);

      // Should find existing portfolio
      const portfolio2 = await Portfolio.findOrCreatePortfolio(userId);
      expect(portfolio2._id.toString()).toBe(portfolio1._id.toString());
    });
  });
});