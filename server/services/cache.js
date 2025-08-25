// Simple in-memory cache implementation
// In production, you would use Redis or similar

class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  set(key, value, ttlSeconds = 300) {
    // Clear existing timer if any
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Set the value
    this.cache.set(key, {
      value,
      createdAt: Date.now(),
      ttl: ttlSeconds * 1000
    });

    // Set expiration timer
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttlSeconds * 1000);

    this.timers.set(key, timer);
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() - item.createdAt > item.ttl) {
      this.delete(key);
      return null;
    }

    return item.value;
  }

  delete(key) {
    // Clear timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }

    // Remove from cache
    this.cache.delete(key);
  }

  clear() {
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    
    // Clear cache
    this.cache.clear();
  }

  has(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }

    // Check if expired
    if (Date.now() - item.createdAt > item.ttl) {
      this.delete(key);
      return false;
    }

    return true;
  }

  size() {
    return this.cache.size;
  }

  keys() {
    return Array.from(this.cache.keys());
  }

  getStats() {
    const now = Date.now();
    let totalSize = 0;
    let expiredCount = 0;
    let validCount = 0;

    this.cache.forEach((item, key) => {
      totalSize += JSON.stringify(item.value).length;
      
      if (now - item.createdAt > item.ttl) {
        expiredCount++;
      } else {
        validCount++;
      }
    });

    return {
      totalKeys: this.cache.size,
      validKeys: validCount,
      expiredKeys: expiredCount,
      totalSizeBytes: totalSize,
      memoryUsage: process.memoryUsage()
    };
  }

  // Clean up expired entries
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];

    this.cache.forEach((item, key) => {
      if (now - item.createdAt > item.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.delete(key));
    
    return keysToDelete.length;
  }
}

// Create global cache instance
const cache = new MemoryCache();

// Run cleanup every 5 minutes
setInterval(() => {
  const cleaned = cache.cleanup();
  if (cleaned > 0) {
    console.log(`Cache cleanup: removed ${cleaned} expired entries`);
  }
}, 5 * 60 * 1000);

// Cache helper functions
const setCachedData = async (key, data, ttlSeconds = 300) => {
  try {
    cache.set(key, data, ttlSeconds);
    return true;
  } catch (error) {
    console.error('Cache set error:', error);
    return false;
  }
};

const getCachedData = async (key) => {
  try {
    return cache.get(key);
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
};

const deleteCachedData = async (key) => {
  try {
    cache.delete(key);
    return true;
  } catch (error) {
    console.error('Cache delete error:', error);
    return false;
  }
};

const clearCache = async () => {
  try {
    cache.clear();
    return true;
  } catch (error) {
    console.error('Cache clear error:', error);
    return false;
  }
};

const getCacheStats = () => {
  return cache.getStats();
};

const hasCachedData = async (key) => {
  try {
    return cache.has(key);
  } catch (error) {
    console.error('Cache has error:', error);
    return false;
  }
};

// Cache key generators
const generateCacheKey = (...parts) => {
  return parts.join(':');
};

const generateUserCacheKey = (userId, ...parts) => {
  return generateCacheKey('user', userId, ...parts);
};

const generatePortfolioCacheKey = (userId, ...parts) => {
  return generateCacheKey('portfolio', userId, ...parts);
};

const generatePriceCacheKey = (...symbols) => {
  return generateCacheKey('prices', symbols.sort().join('-'));
};

const generateAICacheKey = (type, ...params) => {
  return generateCacheKey('ai', type, ...params);
};

// Cache warming functions
const warmCache = async () => {
  console.log('Warming cache with essential data...');
  
  try {
    // Pre-load popular cryptocurrency prices
    const popularSymbols = ['bitcoin', 'ethereum', 'cardano', 'polkadot', 'chainlink'];
    // This would typically fetch from your price service
    // await priceService.fetchPrices(popularSymbols);
    
    console.log('Cache warmed successfully');
  } catch (error) {
    console.error('Cache warming failed:', error);
  }
};

// Cache middleware for Express routes
const cacheMiddleware = (ttlSeconds = 300) => {
  return async (req, res, next) => {
    const cacheKey = generateCacheKey(req.method, req.originalUrl);
    
    try {
      const cachedData = await getCachedData(cacheKey);
      
      if (cachedData) {
        return res.json({
          ...cachedData,
          cached: true,
          cacheKey
        });
      }
      
      // Store original res.json
      const originalJson = res.json;
      
      // Override res.json to cache the response
      res.json = function(data) {
        // Cache successful responses
        if (res.statusCode === 200 && data.success !== false) {
          setCachedData(cacheKey, data, ttlSeconds);
        }
        
        // Call original json method
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

// Cache invalidation patterns
const invalidatePattern = async (pattern) => {
  try {
    const keys = cache.keys();
    const keysToDelete = keys.filter(key => key.includes(pattern));
    
    keysToDelete.forEach(key => cache.delete(key));
    
    console.log(`Invalidated ${keysToDelete.length} cache entries matching pattern: ${pattern}`);
    return keysToDelete.length;
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return 0;
  }
};

const invalidateUserCache = async (userId) => {
  return await invalidatePattern(`user:${userId}`);
};

const invalidatePortfolioCache = async (userId) => {
  return await invalidatePattern(`portfolio:${userId}`);
};

const invalidatePriceCache = async () => {
  return await invalidatePattern('prices:');
};

const invalidateAICache = async () => {
  return await invalidatePattern('ai:');
};

module.exports = {
  // Core cache functions
  setCachedData,
  getCachedData,
  deleteCachedData,
  clearCache,
  getCacheStats,
  hasCachedData,
  
  // Cache key generators
  generateCacheKey,
  generateUserCacheKey,
  generatePortfolioCacheKey,
  generatePriceCacheKey,
  generateAICacheKey,
  
  // Cache utilities
  warmCache,
  cacheMiddleware,
  
  // Cache invalidation
  invalidatePattern,
  invalidateUserCache,
  invalidatePortfolioCache,
  invalidatePriceCache,
  invalidateAICache,
  
  // Direct cache access (for advanced usage)
  cache
};