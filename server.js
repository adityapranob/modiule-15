// express creates the HTTP server and handles API routes.
import express from "express";

// cookieParser reads cookies from incoming requests.
import cookieParser from "cookie-parser";

// dotenv loads environment variables from .env.
import dotenv from "dotenv";

// swaggerUi serves the visual API documentation page.
import swaggerUi from "swagger-ui-express";

// connectRedis connects the app with Redis before the server starts.
import { connectRedis } from "./src/config/redis.js";

// apiRouter contains all API routes.
import apiRouter, { swaggerSpec } from "./src/routes/api.routes.js";


// globalLimiter is the rate limiter we apply to every request.
import { globalLimiter } from "./src/middleware/rateLimiter.middleware.js";

// This line loads .env values into process.env.
dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json());

app.use(cookieParser());

app.use("/api", apiRouter);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.set("trust proxy", "loopback");

app.use(globalLimiter);

// startServer keeps startup code inside one async function.
const startServer = async () => {
  // Redis should connect before we accept requests that depend on login sessions.
  await connectRedis();

  // app.listen starts the Express server.
  app.listen(PORT, () => {
    // This log helps students know the server URL.
    console.log(`Server is running at http://localhost:${PORT}`);

    // This log helps students know the Swagger docs URL.
    console.log(`Swagger docs are available at http://localhost:${PORT}/api-docs`);

    // This log helps students know the Redis server URL.
    console.log(`Redis is available at redis://localhost:6379`);

    // This log helps students know the Redis Stack UI URL.
    console.log(`Redis Stack UI is available at http://localhost:8001`);
  });
};

// Start the server and catch startup errors.
startServer().catch((error) => {
  // Startup errors should be visible because the server cannot run correctly.
  console.error("Failed to start server:", error);

  // Exit with failure code when startup fails.
  process.exit(1);
});