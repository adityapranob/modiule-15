import { randomUUID } from "node:crypto";

import jwt from "jsonwebtoken"

import { redisClient } from "../config/redis.js";

// COOKIE_NAME is read from .env so the cookie name stays consistent everywhere.
const COOKIE_NAME = process.env.COOKIE_NAME || "accessToken";

// COOKIE_MAX_AGE_MS controls how long the browser keeps the auth cookie.
const COOKIE_MAX_AGE_MS = Number(process.env.COOKIE_MAX_AGE_MS || 900000);

// REDIS_SESSION_EXPIRES_IN_SECONDS keeps Redis session expiry aligned with cookie expiry.
const REDIS_SESSION_EXPIRES_IN_SECONDS = Math.floor(COOKIE_MAX_AGE_MS / 1000);


const createCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // sameSite lax helps reduce CSRF risk while still working for normal navigation.
    sameSite: "lax",
    // maxAge controls cookie lifetime in milliseconds.
    maxAge: COOKIE_MAX_AGE_MS,
})

const createClearCookieOptions = () => ({
    // httpOnly should match the original cookie.
    httpOnly: true,

    // secure should match the original cookie environment.
    secure: process.env.NODE_ENV === "production",

    // sameSite should match the original cookie.
    sameSite: "lax",    
})

export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    const rememberMe = req.query.rememberMe === "true"; 
    // req.get reads header value, for example x-device-name: Chrome Browser.
    const deviceName = req.get("x-device-name") || "Unknown Device";

    console.log(deviceName);

    if(!email || !password) {
        return res.status(400).json({
        // The message tells the client what is missing.
        message: "Email and password are required",
        });        
    }

    const isValidDemoUser = 
    email === process.env.DEMO_USER_EMAIL && password === process.env.DEMO_USER_PASSWORD;

    // If credentials are wrong, the user should not receive a token.
    if (!isValidDemoUser) {
        // 401 means authentication failed.
        return res.status(401).json({
        // Keep error messages simple so attackers do not learn which field was wrong.
        message: "Invalid email or password",
        });
    }

    const sessionId = randomUUID();

    const userData = {
        userId: process.env.DEMO_USER_ID,
        email,
        role: "admin",
        deviceName,
        rememberMe,
    }

    const sessionKey = `session:${sessionId}`;

    // Redis stores the session as JSON text with automatic expiry.
    await redisClient.set(sessionKey, JSON.stringify(userData), {
        EX: REDIS_SESSION_EXPIRES_IN_SECONDS,
    });

    const tokenPayload = {
        userId: userData.userId,
        sessionId,
    }

    const accessToken = jwt.sign(tokenPayload, process.env.JWT_ACCESS_SECRET, {
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
    })

    // For protected APIs, developer should not copy the token. The browser will automatically send the cookie with the next request, if Swagger UI and API are on the same origin
    res.cookie(COOKIE_NAME, accessToken, createCookieOptions());

    return res.status(200).json({
        message: "Login Successful.",
        user: userData,
        note: "JWT is stored in an HttpOnly cookie, and the session is stored in Redis",
    });

};

// getAuthenticatedUser returns the logged-in user's profile.
export const getAuthenticatedUser = async (req, res) => {
  // req.user is added by authMiddleware after JWT and Redis session verification.
  return res.status(200).json({
    // This message confirms that authentication worked.
    message: "Authenticated user profile loaded",

    // This user came from Redis, not from trusting the client directly.
    user: req.user,
  });
};

// logoutUser removes the Redis session and clears the browser cookie.
export const logoutUser = async (req, res) => {
  // sessionKey points to the current user's Redis session.
  const sessionKey = `session:${req.sessionId}`;

  // Deleting the Redis session makes this JWT unusable even if the cookie still exists.
  await redisClient.del(sessionKey);

  // clearCookie removes the JWT cookie from the browser.
  res.clearCookie(COOKIE_NAME, createClearCookieOptions());

  // 200 means logout completed successfully.
  return res.status(200).json({
    // This message confirms logout.
    message: "Logout successful",
  });
};