import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';

interface DashboardProps {
  portfolioData: any[];
  marketData: any;
}

const Dashboard: React.FC<DashboardProps> = ({ portfolioData, marketData }) => {
  // Mock data for demonstration
  const mockPriceData = [
    { time: '00:00', BTC: 45000, ETH: 3000, ADA: 0.5 },
    { time: '04:00', BTC: 45500, ETH: 3100, ADA: 0.52 },
    { time: '08:00', BTC: 44800, ETH: 2950, ADA: 0.48 },
    { time: '12:00', BTC: 46200, ETH: 3200, ADA: 0.55 },
    { time: '16:00', BTC: 47000, ETH: 3300, ADA: 0.58 },
    { time: '20:00', BTC: 46800, ETH: 3250, ADA: 0.56 },
  ];

  const mockPortfolioDistribution = [
    { name: 'Bitcoin', value: 45, color: '#F7931A' },
    { name: 'Ethereum', value: 30, color: '#627EEA' },
    { name: 'Cardano', value: 15, color: '#0033AD' },
    { name: 'Others', value: 10, color: '#8B5CF6' },
  ];

  const totalValue = 125430.50;
  const dailyChange = 2.34;
  const dailyChangePercent = 1.89;

  return (
    <div className="space-y-6">
      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Portfolio Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${totalValue.toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">24h Change</p>
              <p className="text-2xl font-bold text-green-500">
                +${dailyChange.toFixed(2)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">24h Change %</p>
              <p className="text-2xl font-bold text-green-500">
                +{dailyChangePercent}%
              </p>
            </div>
            <Percent className="w-8 h-8 text-green-500" />
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Price Trends (24h)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockPriceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }} 
              />
              <Line type="monotone" dataKey="BTC" stroke="#F7931A" strokeWidth={2} />
              <Line type="monotone" dataKey="ETH" stroke="#627EEA" strokeWidth={2} />
              <Line type="monotone" dataKey="ADA" stroke="#0033AD" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Portfolio Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Portfolio Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={mockPortfolioDistribution}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {mockPortfolioDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Top Holdings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Top Holdings
        </h3>
        <div className="space-y-4">
          {[
            { symbol: 'BTC', name: 'Bitcoin', amount: '1.25', value: '$58,750', change: '+2.4%' },
            { symbol: 'ETH', name: 'Ethereum', amount: '12.5', value: '$40,625', change: '+3.1%' },
            { symbol: 'ADA', name: 'Cardano', amount: '35,000', value: '$19,600', change: '-1.2%' },
          ].map((holding, index) => (
            <div key={holding.symbol} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {holding.symbol.slice(0, 2)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{holding.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{holding.amount} {holding.symbol}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900 dark:text-white">{holding.value}</p>
                <p className={`text-sm ${holding.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                  {holding.change}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;