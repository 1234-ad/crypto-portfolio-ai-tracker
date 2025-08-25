const { body, param, query, validationResult } = require('express-validator');

// Error handler for validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

// Portfolio validation rules
const validatePortfolioData = [
  body('symbol')
    .notEmpty()
    .withMessage('Symbol is required')
    .isLength({ min: 1, max: 10 })
    .withMessage('Symbol must be between 1 and 10 characters')
    .matches(/^[A-Za-z0-9]+$/)
    .withMessage('Symbol must contain only letters and numbers'),
    
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters')
    .trim(),
    
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0.00000001 })
    .withMessage('Amount must be a positive number greater than 0'),
    
  body('purchasePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Purchase price must be a positive number'),
    
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters')
    .trim(),
    
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
    
  body('tags.*')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters')
    .trim(),
    
  handleValidationErrors
];

// Update portfolio validation (more lenient)
const validatePortfolioUpdate = [
  body('amount')
    .optional()
    .isFloat({ min: 0.00000001 })
    .withMessage('Amount must be a positive number greater than 0'),
    
  body('purchasePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Purchase price must be a positive number'),
    
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters')
    .trim(),
    
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
    
  handleValidationErrors
];

// AI insights validation
const validateAIInsightsRequest = [
  body('symbols')
    .optional()
    .isArray({ min: 1, max: 20 })
    .withMessage('Symbols must be an array with 1-20 items'),
    
  body('symbols.*')
    .isLength({ min: 1, max: 10 })
    .withMessage('Each symbol must be between 1 and 10 characters')
    .matches(/^[A-Za-z0-9]+$/)
    .withMessage('Symbols must contain only letters and numbers'),
    
  body('symbol')
    .optional()
    .isLength({ min: 1, max: 10 })
    .withMessage('Symbol must be between 1 and 10 characters')
    .matches(/^[A-Za-z0-9]+$/)
    .withMessage('Symbol must contain only letters and numbers'),
    
  handleValidationErrors
];

// Market data validation
const validateMarketDataRequest = [
  query('symbols')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        const symbols = value.split(',');
        if (symbols.length > 50) {
          throw new Error('Maximum 50 symbols allowed');
        }
        
        symbols.forEach(symbol => {
          if (!/^[A-Za-z0-9-]+$/.test(symbol.trim())) {
            throw new Error('Invalid symbol format');
          }
        });
      }
      return true;
    }),
    
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365'),
    
  param('id')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('ID must be between 1 and 50 characters')
    .matches(/^[A-Za-z0-9-]+$/)
    .withMessage('ID must contain only letters, numbers, and hyphens'),
    
  handleValidationErrors
];

// User settings validation
const validateUserSettings = [
  body('notifications')
    .optional()
    .isObject()
    .withMessage('Notifications must be an object'),
    
  body('notifications.priceAlerts')
    .optional()
    .isBoolean()
    .withMessage('Price alerts must be a boolean'),
    
  body('notifications.portfolioUpdates')
    .optional()
    .isBoolean()
    .withMessage('Portfolio updates must be a boolean'),
    
  body('notifications.aiInsights')
    .optional()
    .isBoolean()
    .withMessage('AI insights must be a boolean'),
    
  body('privacy')
    .optional()
    .isObject()
    .withMessage('Privacy must be an object'),
    
  body('privacy.sharePortfolio')
    .optional()
    .isBoolean()
    .withMessage('Share portfolio must be a boolean'),
    
  body('display')
    .optional()
    .isObject()
    .withMessage('Display must be an object'),
    
  body('display.currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'JPY', 'BTC', 'ETH'])
    .withMessage('Currency must be one of: USD, EUR, GBP, JPY, BTC, ETH'),
    
  body('display.language')
    .optional()
    .isIn(['en', 'es', 'fr', 'de', 'ja'])
    .withMessage('Language must be one of: en, es, fr, de, ja'),
    
  body('display.refreshInterval')
    .optional()
    .isInt({ min: 10, max: 300 })
    .withMessage('Refresh interval must be between 10 and 300 seconds'),
    
  handleValidationErrors
];

// Price alert validation
const validatePriceAlert = [
  body('symbol')
    .notEmpty()
    .withMessage('Symbol is required')
    .isLength({ min: 1, max: 10 })
    .withMessage('Symbol must be between 1 and 10 characters')
    .matches(/^[A-Za-z0-9]+$/)
    .withMessage('Symbol must contain only letters and numbers'),
    
  body('type')
    .notEmpty()
    .withMessage('Alert type is required')
    .isIn(['above', 'below', 'change'])
    .withMessage('Alert type must be: above, below, or change'),
    
  body('targetPrice')
    .if(body('type').isIn(['above', 'below']))
    .notEmpty()
    .withMessage('Target price is required for above/below alerts')
    .isFloat({ min: 0 })
    .withMessage('Target price must be a positive number'),
    
  body('changePercent')
    .if(body('type').equals('change'))
    .notEmpty()
    .withMessage('Change percent is required for change alerts')
    .isFloat({ min: 0.1, max: 100 })
    .withMessage('Change percent must be between 0.1 and 100'),
    
  body('enabled')
    .optional()
    .isBoolean()
    .withMessage('Enabled must be a boolean'),
    
  handleValidationErrors
];

// Generic ID validation
const validateId = [
  param('id')
    .notEmpty()
    .withMessage('ID is required')
    .isMongoId()
    .withMessage('Invalid ID format'),
    
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1 and 1000'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
    
  query('sort')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'name', 'symbol', 'amount', 'value'])
    .withMessage('Invalid sort field'),
    
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc'),
    
  handleValidationErrors
];

// Search validation
const validateSearch = [
  query('q')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
    .trim(),
    
  query('category')
    .optional()
    .isIn(['all', 'coins', 'tokens', 'defi', 'nft'])
    .withMessage('Invalid category'),
    
  handleValidationErrors
];

// File upload validation
const validateFileUpload = [
  body('fileType')
    .optional()
    .isIn(['csv', 'json', 'xlsx'])
    .withMessage('File type must be csv, json, or xlsx'),
    
  body('maxSize')
    .optional()
    .isInt({ min: 1, max: 10485760 }) // 10MB max
    .withMessage('Max size must be between 1 byte and 10MB'),
    
  handleValidationErrors
];

// Rate limiting validation
const validateRateLimit = (windowMs = 900000, max = 100) => {
  return (req, res, next) => {
    // Simple in-memory rate limiting
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!req.app.locals.rateLimitStore) {
      req.app.locals.rateLimitStore = new Map();
    }
    
    const store = req.app.locals.rateLimitStore;
    const userRequests = store.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= max) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    // Add current request
    validRequests.push(now);
    store.set(key, validRequests);
    
    next();
  };
};

// Sanitization helpers
const sanitizeInput = (req, res, next) => {
  // Remove any potential XSS attempts
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }
    return value;
  };
  
  const sanitizeObject = (obj) => {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'object') {
          sanitizeObject(obj[key]);
        } else {
          obj[key] = sanitizeValue(obj[key]);
        }
      });
    }
  };
  
  sanitizeObject(req.body);
  sanitizeObject(req.query);
  sanitizeObject(req.params);
  
  next();
};

module.exports = {
  // Portfolio validations
  validatePortfolioData,
  validatePortfolioUpdate,
  
  // AI validations
  validateAIInsightsRequest,
  
  // Market data validations
  validateMarketDataRequest,
  
  // User validations
  validateUserSettings,
  validatePriceAlert,
  
  // Generic validations
  validateId,
  validatePagination,
  validateSearch,
  validateFileUpload,
  
  // Security
  validateRateLimit,
  sanitizeInput,
  
  // Utility
  handleValidationErrors
};