const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class AIInsightsService {
  async generatePortfolioAnalysis(portfolio, marketData) {
    try {
      const prompt = `
        Analyze this cryptocurrency portfolio and provide insights:
        
        Portfolio: ${JSON.stringify(portfolio, null, 2)}
        Market Data: ${JSON.stringify(marketData, null, 2)}
        
        Please provide:
        1. Overall portfolio health assessment
        2. Risk analysis and diversification recommendations
        3. Market trend insights for held coins
        4. Potential opportunities or warnings
        5. Suggested actions (buy/sell/hold)
        
        Keep the response concise but informative.
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional cryptocurrency analyst providing portfolio insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('AI Analysis Error:', error);
      return 'Unable to generate AI insights at this time.';
    }
  }

  async generateMarketSentiment(coinSymbols) {
    try {
      const prompt = `
        Analyze the current market sentiment for these cryptocurrencies: ${coinSymbols.join(', ')}
        
        Consider:
        - Recent news and developments
        - Social media sentiment
        - Technical indicators
        - Market trends
        
        Provide a sentiment score (1-10) and brief explanation for each coin.
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a cryptocurrency market sentiment analyst.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.6,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Sentiment Analysis Error:', error);
      return 'Unable to analyze market sentiment at this time.';
    }
  }

  async generatePricePrediction(coinData) {
    try {
      const prompt = `
        Based on this cryptocurrency data, provide a price prediction analysis:
        
        ${JSON.stringify(coinData, null, 2)}
        
        Consider:
        - Historical price patterns
        - Volume trends
        - Market cap changes
        - Technical indicators
        
        Provide:
        1. Short-term prediction (1-7 days)
        2. Medium-term outlook (1-4 weeks)
        3. Key factors influencing price
        4. Confidence level
        
        Note: This is for educational purposes only, not financial advice.
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a cryptocurrency technical analyst. Always include disclaimers about predictions being speculative.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 600,
        temperature: 0.5,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Price Prediction Error:', error);
      return 'Unable to generate price predictions at this time.';
    }
  }
}

module.exports = new AIInsightsService();