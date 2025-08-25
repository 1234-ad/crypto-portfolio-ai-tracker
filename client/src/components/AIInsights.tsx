import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, AlertTriangle, Target, Lightbulb, RefreshCw } from 'lucide-react';
import axios from 'axios';

interface AIInsightsProps {
  portfolioData: any[];
  marketData: any;
}

const AIInsights: React.FC<AIInsightsProps> = ({ portfolioData, marketData }) => {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState('portfolio');

  // Mock AI insights data
  const mockInsights = {
    portfolio: {
      title: "Portfolio Health Analysis",
      score: 8.2,
      summary: "Your portfolio shows strong diversification with a healthy mix of large-cap and mid-cap cryptocurrencies. The current allocation favors Bitcoin and Ethereum, which provides stability.",
      recommendations: [
        "Consider reducing Bitcoin allocation from 45% to 35% for better diversification",
        "Increase exposure to DeFi tokens like UNI or AAVE for growth potential",
        "Your Cardano position is well-timed with upcoming network upgrades"
      ],
      risks: [
        "High correlation between ETH and altcoin positions during market downturns",
        "Lack of stablecoin allocation for market volatility protection"
      ]
    },
    sentiment: {
      title: "Market Sentiment Analysis",
      overall: "Bullish",
      coins: [
        { symbol: 'BTC', sentiment: 'Neutral', score: 6.8, trend: 'Consolidating around key support levels' },
        { symbol: 'ETH', sentiment: 'Bullish', score: 8.1, trend: 'Strong institutional adoption and staking growth' },
        { symbol: 'ADA', sentiment: 'Bullish', score: 7.5, trend: 'Positive development activity and partnerships' },
        { symbol: 'DOT', sentiment: 'Neutral', score: 6.2, trend: 'Awaiting parachain auction results' }
      ]
    },
    predictions: {
      title: "AI Price Predictions",
      disclaimer: "Predictions are for educational purposes only and should not be considered financial advice.",
      forecasts: [
        {
          symbol: 'BTC',
          current: 47000,
          shortTerm: { price: 49500, confidence: 72, timeframe: '7 days' },
          mediumTerm: { price: 52000, confidence: 65, timeframe: '30 days' }
        },
        {
          symbol: 'ETH',
          current: 3250,
          shortTerm: { price: 3450, confidence: 78, timeframe: '7 days' },
          mediumTerm: { price: 3800, confidence: 70, timeframe: '30 days' }
        },
        {
          symbol: 'ADA',
          current: 0.56,
          shortTerm: { price: 0.62, confidence: 68, timeframe: '7 days' },
          mediumTerm: { price: 0.75, confidence: 60, timeframe: '30 days' }
        }
      ]
    }
  };

  const generateInsights = async () => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      setInsights(mockInsights);
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateInsights();
  }, []);

  const renderPortfolioAnalysis = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            insights.portfolio.score >= 8 ? 'bg-green-100 text-green-600' :
            insights.portfolio.score >= 6 ? 'bg-yellow-100 text-yellow-600' :
            'bg-red-100 text-red-600'
          }`}>
            <span className="text-lg font-bold">{insights.portfolio.score}</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Portfolio Health Score
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Out of 10.0
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
        <p className="text-gray-700 dark:text-gray-300">
          {insights.portfolio.summary}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="flex items-center text-md font-semibold text-gray-900 dark:text-white mb-3">
            <Target className="w-5 h-5 mr-2 text-blue-500" />
            Recommendations
          </h4>
          <ul className="space-y-2">
            {insights.portfolio.recommendations.map((rec: string, index: number) => (
              <li key={index} className="flex items-start space-x-2">
                <Lightbulb className="w-4 h-4 mt-0.5 text-yellow-500 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="flex items-center text-md font-semibold text-gray-900 dark:text-white mb-3">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
            Risk Factors
          </h4>
          <ul className="space-y-2">
            {insights.portfolio.risks.map((risk: string, index: number) => (
              <li key={index} className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 text-red-500 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{risk}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  const renderSentimentAnalysis = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
          insights.sentiment.overall === 'Bullish' ? 'bg-green-100 text-green-800' :
          insights.sentiment.overall === 'Bearish' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          Overall Market Sentiment: {insights.sentiment.overall}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.sentiment.coins.map((coin: any, index: number) => (
          <motion.div
            key={coin.symbol}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {coin.symbol}
              </h4>
              <div className={`px-2 py-1 rounded text-xs font-medium ${
                coin.sentiment === 'Bullish' ? 'bg-green-100 text-green-800' :
                coin.sentiment === 'Bearish' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {coin.sentiment}
              </div>
            </div>
            <div className="mb-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Sentiment Score</span>
                <span className="font-medium text-gray-900 dark:text-white">{coin.score}/10</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1">
                <div
                  className={`h-2 rounded-full ${
                    coin.score >= 7 ? 'bg-green-500' :
                    coin.score >= 5 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${coin.score * 10}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {coin.trend}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderPredictions = () => (
    <div className="space-y-6">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            {insights.predictions.disclaimer}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {insights.predictions.forecasts.map((forecast: any, index: number) => (
          <motion.div
            key={forecast.symbol}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                {forecast.symbol}
              </h4>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Current: ${forecast.current.toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Short-term ({forecast.shortTerm.timeframe})
                </h5>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    ${forecast.shortTerm.price.toLocaleString()}
                  </span>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      forecast.shortTerm.price > forecast.current ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {((forecast.shortTerm.price - forecast.current) / forecast.current * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {forecast.shortTerm.confidence}% confidence
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Medium-term ({forecast.mediumTerm.timeframe})
                </h5>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    ${forecast.mediumTerm.price.toLocaleString()}
                  </span>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      forecast.mediumTerm.price > forecast.current ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {((forecast.mediumTerm.price - forecast.current) / forecast.current * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {forecast.mediumTerm.confidence}% confidence
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Brain className="w-8 h-8 text-purple-500" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              AI Insights
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Powered by advanced AI analysis
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={generateInsights}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Insights</span>
        </motion.button>
      </div>

      {/* Analysis Type Selector */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {[
          { id: 'portfolio', label: 'Portfolio Analysis', icon: Target },
          { id: 'sentiment', label: 'Market Sentiment', icon: TrendingUp },
          { id: 'predictions', label: 'Price Predictions', icon: Brain },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedAnalysis(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-all ${
                selectedAnalysis === tab.id
                  ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <motion.div
        key={selectedAnalysis}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700"
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Generating AI insights...
              </p>
            </div>
          </div>
        ) : insights ? (
          <>
            {selectedAnalysis === 'portfolio' && renderPortfolioAnalysis()}
            {selectedAnalysis === 'sentiment' && renderSentimentAnalysis()}
            {selectedAnalysis === 'predictions' && renderPredictions()}
          </>
        ) : (
          <div className="text-center py-12">
            <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Click "Refresh Insights" to generate AI analysis
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AIInsights;