const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoose = require('mongoose');
require('dotenv').config();

const portfolioRoutes = require('./routes/portfolio');
const aiInsightsRoutes = require('./routes/aiInsights');
const marketDataRoutes = require('./routes/marketData');
const { initializeWebSocket } = require('./services/websocket');
const { startPriceUpdates } = require('./services/priceUpdater');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crypto-tracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Routes
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/ai-insights', aiInsightsRoutes);
app.use('/api/market-data', marketDataRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Initialize WebSocket
initializeWebSocket(io);

// Start price updates
startPriceUpdates(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 WebSocket server initialized`);
});

module.exports = { app, io };