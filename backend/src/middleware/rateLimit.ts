import rateLimit from 'express-rate-limit'

/**
 * Auth endpoint rate limiter: 5 attempts per 15 minutes per IP.
 * In production this should use a Redis store so limits survive restarts
 * and work across multiple API instances.
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true, // Return rate-limit headers (RateLimit-*)
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many attempts. Please try again in 15 minutes.',
  },
  skipSuccessfulRequests: true, // Only count failed requests toward the limit
})

/**
 * General API rate limiter: 200 requests per minute per IP.
 */
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please slow down.',
  },
})
