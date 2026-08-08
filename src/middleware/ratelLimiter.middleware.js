import rateLimit from "express-rate-limit";

import { RedisStore } from "rate-limit-redis";

import { redisClient } from "../config/redis.js";

// Custom handler: instead of the default text, we return a JSON 429 that
// matches the rest of this API's response style.
const jsonHandler = (req, res /*, next, options */) => {
   res.status(429).json({
      message: "Too many requests, please slow down.",

      // The Math.ceil() function rounds the resulting number up to the nearest next largest integer. For example, if the header returns 12.1, it rounds up to 13. This ensures the client waits long enough and doesn't retry too early due to sub-second rounding errors.

      retryAfterSeconds: Math.ceil(res.getHeader("Retry-After") || 60),
   });
};

// globalLimiter protects every route. Default: 100 requests per 15 minutes per IP.
export const globalLimiter = rateLimit({
   // windowMs: time window in ms. 15 min = 15 * 60 * 1000.
   windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),

   // max: number of allowed requests per windowMs per IP.
   max: Number(process.env.RATE_LIMIT_MAX || 100),

   // standardHeaders: "draft-7" sends the modern RateLimit-* headers (RFC draft).
   standardHeaders: "draft-7",

   // legacyHeaders: false disables the older X-RateLimit-* headers.
   legacyHeaders: false,

   // store: RedisStore keeps the counter in Redis so all instances agree.
   store: new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
      prefix: "rl:global:", // every key starts with rl:global:
   }),

   // handler: respond with our JSON style instead of plain text.
   handler: jsonHandler,
});

// authLimiter is stricter and protects the login endpoint only.
export const authLimiter = rateLimit({
   windowMs: Number(15 * 60 * 1000),
   max: Number(5),
   standardHeaders: "draft-7",
   legacyHeaders: false,
   // message is overridden by handler above.
   store: new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
      prefix: "rl:auth:", // keys here start with rl:auth:
   }),
   handler: jsonHandler,
});