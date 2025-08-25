const { getCachedData } = require('./cache');
const marketDataService = require('./marketData');

let io;
const connectedUsers = new Map();
const userSubscriptions = new Map();

const initializeWebSocket = (socketIo) => {
  io = socketIo;
  
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    // Store user connection
    connectedUsers.set(socket.id, {
      socketId: socket.id,
      userId: null,
      connectedAt: new Date(),
      subscriptions: new Set()
    });

    // Handle user authentication
    socket.on('authenticate', (data) => {
      const user = connectedUsers.get(socket.id);
      if (user) {
        user.userId = data.userId;
        console.log(`User authenticated: ${data.userId}`);
      }
    });

    // Handle portfolio subscription
    socket.on('subscribe-portfolio', (data) => {
      const { userId, symbols } = data;
      const user = connectedUsers.get(socket.id);
      
      if (user) {
        user.userId = userId;
        user.subscriptions = new Set(symbols);
        
        // Add to user subscriptions map
        if (!userSubscriptions.has(userId)) {
          userSubscriptions.set(userId, new Set());
        }
        userSubscriptions.get(userId).add(socket.id);
        
        console.log(`User ${userId} subscribed to: ${symbols.join(', ')}`);
        
        // Send initial data
        sendInitialPortfolioData(socket, symbols);
      }
    });

    // Handle price alerts subscription
    socket.on('subscribe-alerts', (data) => {
      const { alerts } = data;
      const user = connectedUsers.get(socket.id);
      
      if (user) {
        user.alerts = alerts;
        console.log(`User subscribed to ${alerts.length} price alerts`);
      }
    });

    // Handle unsubscribe
    socket.on('unsubscribe', () => {
      const user = connectedUsers.get(socket.id);
      if (user && user.userId) {
        const userSockets = userSubscriptions.get(user.userId);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            userSubscriptions.delete(user.userId);
          }
        }
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      
      const user = connectedUsers.get(socket.id);
      if (user && user.userId) {
        const userSockets = userSubscriptions.get(user.userId);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            userSubscriptions.delete(user.userId);
          }
        }
      }
      
      connectedUsers.delete(socket.id);
    });

    // Handle ping for connection health
    socket.on('ping', () => {
      socket.emit('pong');
    });
  });

  console.log('WebSocket server initialized');
};

// Send initial portfolio data to newly connected user
const sendInitialPortfolioData = async (socket, symbols) => {
  try {
    const prices = await marketDataService.getPricesForSymbols(symbols);
    socket.emit('priceUpdate', prices);
  } catch (error) {
    console.error('Error sending initial portfolio data:', error);
  }
};

// Broadcast price updates to all subscribed users
const broadcastPriceUpdates = async (priceData) => {
  if (!io || connectedUsers.size === 0) return;

  const updateData = {
    prices: priceData,
    timestamp: new Date().toISOString()
  };

  // Send to all connected users
  connectedUsers.forEach((user, socketId) => {
    if (user.subscriptions && user.subscriptions.size > 0) {
      // Filter price data to only include subscribed symbols
      const filteredPrices = {};
      user.subscriptions.forEach(symbol => {
        if (priceData[symbol]) {
          filteredPrices[symbol] = priceData[symbol];
        }
      });

      if (Object.keys(filteredPrices).length > 0) {
        io.to(socketId).emit('priceUpdate', {
          prices: filteredPrices,
          timestamp: updateData.timestamp
        });
      }
    }
  });
};

// Broadcast portfolio updates to specific user
const broadcastPortfolioUpdate = (userId, portfolioData) => {
  if (!io) return;

  const userSockets = userSubscriptions.get(userId);
  if (userSockets) {
    userSockets.forEach(socketId => {
      io.to(socketId).emit('portfolioUpdate', {
        portfolio: portfolioData,
        timestamp: new Date().toISOString()
      });
    });
  }
};

// Send price alerts to users
const sendPriceAlert = (userId, alert) => {
  if (!io) return;

  const userSockets = userSubscriptions.get(userId);
  if (userSockets) {
    userSockets.forEach(socketId => {
      io.to(socketId).emit('priceAlert', {
        alert,
        timestamp: new Date().toISOString()
      });
    });
  }
};

// Send AI insights to users
const broadcastAIInsights = (userId, insights) => {
  if (!io) return;

  const userSockets = userSubscriptions.get(userId);
  if (userSockets) {
    userSockets.forEach(socketId => {
      io.to(socketId).emit('aiInsights', {
        insights,
        timestamp: new Date().toISOString()
      });
    });
  }
};

// Send market news to all users
const broadcastMarketNews = (news) => {
  if (!io) return;

  io.emit('marketNews', {
    news,
    timestamp: new Date().toISOString()
  });
};

// Send system notifications
const broadcastSystemNotification = (notification) => {
  if (!io) return;

  io.emit('systemNotification', {
    notification,
    timestamp: new Date().toISOString()
  });
};

// Get connection statistics
const getConnectionStats = () => {
  return {
    totalConnections: connectedUsers.size,
    authenticatedUsers: Array.from(connectedUsers.values()).filter(u => u.userId).length,
    totalSubscriptions: userSubscriptions.size,
    uptime: process.uptime()
  };
};

// Check price alerts for all users
const checkPriceAlerts = async (priceData) => {
  connectedUsers.forEach((user, socketId) => {
    if (user.alerts && user.alerts.length > 0) {
      user.alerts.forEach(alert => {
        const currentPrice = priceData[alert.symbol.toLowerCase()]?.usd;
        
        if (currentPrice) {
          let triggered = false;
          let message = '';

          switch (alert.type) {
            case 'above':
              if (currentPrice > alert.targetPrice) {
                triggered = true;
                message = `${alert.symbol.toUpperCase()} is now above $${alert.targetPrice}`;
              }
              break;
            case 'below':
              if (currentPrice < alert.targetPrice) {
                triggered = true;
                message = `${alert.symbol.toUpperCase()} is now below $${alert.targetPrice}`;
              }
              break;
            case 'change':
              const changePercent = priceData[alert.symbol.toLowerCase()]?.usd_24h_change;
              if (Math.abs(changePercent) > alert.changePercent) {
                triggered = true;
                message = `${alert.symbol.toUpperCase()} changed by ${changePercent.toFixed(2)}%`;
              }
              break;
          }

          if (triggered) {
            io.to(socketId).emit('priceAlert', {
              alert: {
                ...alert,
                currentPrice,
                message,
                triggeredAt: new Date().toISOString()
              },
              timestamp: new Date().toISOString()
            });
          }
        }
      });
    }
  });
};

// Cleanup inactive connections
const cleanupConnections = () => {
  const now = new Date();
  const timeout = 30 * 60 * 1000; // 30 minutes

  connectedUsers.forEach((user, socketId) => {
    if (now - user.connectedAt > timeout) {
      console.log(`Cleaning up inactive connection: ${socketId}`);
      
      if (user.userId) {
        const userSockets = userSubscriptions.get(user.userId);
        if (userSockets) {
          userSockets.delete(socketId);
          if (userSockets.size === 0) {
            userSubscriptions.delete(user.userId);
          }
        }
      }
      
      connectedUsers.delete(socketId);
    }
  });
};

// Start cleanup interval
setInterval(cleanupConnections, 5 * 60 * 1000); // Every 5 minutes

module.exports = {
  initializeWebSocket,
  broadcastPriceUpdates,
  broadcastPortfolioUpdate,
  sendPriceAlert,
  broadcastAIInsights,
  broadcastMarketNews,
  broadcastSystemNotification,
  checkPriceAlerts,
  getConnectionStats
};