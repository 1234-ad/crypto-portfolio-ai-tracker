import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { TrendingUp, Brain, Shield, Zap } from 'lucide-react';

import Dashboard from './components/Dashboard';
import Portfolio from './components/Portfolio';
import AIInsights from './components/AIInsights';
import Settings from './components/Settings';
import Navbar from './components/Navbar';
import { useSocket } from './hooks/useSocket';
import { useTheme } from './hooks/useTheme';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [portfolioData, setPortfolioData] = useState([]);
  const [marketData, setMarketData] = useState({});
  const { theme, toggleTheme } = useTheme();
  const socket = useSocket();

  useEffect(() => {
    if (socket) {
      socket.on('priceUpdate', (data) => {
        setMarketData(prev => ({ ...prev, ...data }));
      });

      socket.on('portfolioUpdate', (data) => {
        setPortfolioData(data);
      });

      return () => {
        socket.off('priceUpdate');
        socket.off('portfolioUpdate');
      };
    }
  }, [socket]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard portfolioData={portfolioData} marketData={marketData} />;
      case 'portfolio':
        return <Portfolio portfolioData={portfolioData} setPortfolioData={setPortfolioData} />;
      case 'ai-insights':
        return <AIInsights portfolioData={portfolioData} marketData={marketData} />;
      case 'settings':
        return <Settings theme={theme} toggleTheme={toggleTheme} />;
      default:
        return <Dashboard portfolioData={portfolioData} marketData={marketData} />;
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className={`text-4xl font-bold mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Crypto Portfolio AI Tracker
          </h1>
          <p className={`text-lg ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Real-time tracking with AI-powered insights
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { icon: TrendingUp, title: 'Real-time Data', desc: 'Live price updates' },
            { icon: Brain, title: 'AI Insights', desc: 'Smart analysis' },
            { icon: Shield, title: 'Risk Assessment', desc: 'Portfolio protection' },
            { icon: Zap, title: 'Fast Updates', desc: 'Instant notifications' }
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`p-6 rounded-xl ${
                theme === 'dark' 
                  ? 'bg-gray-800/50 border border-gray-700' 
                  : 'bg-white/80 border border-gray-200'
              } backdrop-blur-sm`}
            >
              <feature.icon className={`w-8 h-8 mb-3 ${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              }`} />
              <h3 className={`font-semibold mb-1 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {feature.title}
              </h3>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </main>

      <Toaster 
        position="top-right"
        toastOptions={{
          className: theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900',
        }}
      />
    </div>
  );
}

export default App;