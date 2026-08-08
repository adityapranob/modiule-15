// jwt verifies whether the access token is valid.
import jwt from "jsonwebtoken";

// redisClient checks whether the login session still exists in Redis.
import { redisClient } from "../config/redis.js";

// COOKIE_NAME must match the name used while setting the login cookie.
const COOKIE_NAME = process.env.COOKIE_NAME || "accessToken";

// authMiddleware protects routes that require login.
export const authMiddleware = async (req, res, next) => {
  try {
    // req.cookies is available because server.js uses cookie-parser.
    const token = req.cookies?.[COOKIE_NAME];

    // If there is no token cookie, the user is not logged in.
    if (!token) {
      // 401 means authentication is required.
      return res.status(401).json({
        // The message explains why access was denied.
        message: "Authentication cookie is missing",
      });
    }

    // jwt.verify checks token signature and expiry.
    const decodedToken = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // sessionKey is used to find this exact login session in Redis.
    const sessionKey = `session:${decodedToken.sessionId}`;

    // Redis get returns the saved session text if the session is still active.
    const savedSession = await redisClient.get(sessionKey);

    // If Redis session is missing, the user has logged out or the session expired.
    if (!savedSession) {
      // 401 means the token is not enough because the server session is gone.
      return res.status(401).json({
        // This message teaches why Redis-backed JWT is stronger than plain JWT.
        message: "Session expired or logged out",
      });
    }

    // JSON.parse converts Redis text back into a JavaScript object.
    const user = JSON.parse(savedSession);

    // This check prevents accepting a token that does not match the Redis user session.
    if (user.userId !== decodedToken.userId) {
      // 401 means the token and session do not match.
      return res.status(401).json({
        // The message stays simple for security.
        message: "Invalid session",
      });
    }

    // req.user makes user data available to the next controller.
    req.user = user;

    // req.sessionId makes the current session id available to logout controller.
    req.sessionId = decodedToken.sessionId;

    // next allows the request to continue to the protected controller.
    return next();
  } catch (error) {
    // TokenExpiredError means JWT lifetime is over.
    if (error.name === "TokenExpiredError") {
      // 401 tells the client to login again.
      return res.status(401).json({
        // The message explains the token expiry.
        message: "Token expired, please login again",
      });
    }

    // Any other JWT error means the token is invalid or modified.
    return res.status(401).json({
      // The message avoids exposing technical security details.
      message: "Invalid authentication token",
    });
  }
};