import { Router } from "express";

import swaggerJsdoc from "swagger-jsdoc";

import { authLimiter } from "../middleware/rateLimiter.middleware.js";

import {
  readClientInfoHeaders,
  readNameFromQuery,
  sendAcceptedStatusExample,
  sendHealthStatus,
  sendUserInfoAsJson,
  sendWelcomeMessage,
} from "../controller/requestResponse.controller.js";

import {
  getAuthenticatedUser,
  loginUser,
  logoutUser,
} from "../controller/auth.controller.js";

// authMiddleware protects routes that require a logged-in user.
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// swaggerSpec is exported so server.js can show Swagger UI at /api-docs.
export const swaggerSpec = swaggerJsdoc({
  // definition contains the main OpenAPI information.
  definition: {
    // openapi version tells Swagger which specification format we are using.
    openapi: "3.0.0",

    // info describes the API title and version.
    info: {
      // title appears at the top of Swagger UI.
      title: "Beginner Express Redis JWT Cookie API",

      // version helps teams track API documentation changes.
      version: "1.0.0",

      // description explains what students are learning in this API.
      description: "Express routing, requests, responses, Redis-backed JWT cookie auth, and Swagger docs",
    },

    // servers tells Swagger where the API is running.
    servers: [
      {
        // This URL matches our local Express server.
        url: "http://localhost:5000",
      },
    ],

    // components define reusable schemas and security settings.
    components: {
      // securitySchemes describes how protected routes are authenticated.
      securitySchemes: {
        // cookieAuth tells Swagger that auth token is stored in a cookie.
        cookieAuth: {
          // apiKey type can represent a cookie-based token.
          type: "apiKey",

          // in cookie means the token is sent through browser cookie.
          in: "cookie",

          // name must match the actual cookie name.
          name: process.env.COOKIE_NAME || "accessToken",
        },
      },

      // schemas define reusable request and response shapes.
      schemas: {
        // LoginRequest describes the JSON body for login.
        LoginRequest: {
          // object means the request body is a JSON object.
          type: "object",

          // required means these fields must be sent by the client.
          required: ["email", "password"],

          // properties describe each field.
          properties: {
            // email is the user's login email.
            email: {
              // string means the value must be text.
              type: "string",

              // example helps students test quickly.
              example: "student@example.com",
            },

            // password is the user's login password.
            password: {
              // string means the value must be text.
              type: "string",

              // example matches our .env demo password.
              example: "123456",
            },
          },
        },

        // User describes the safe user object returned by the API.
        User: {
          // object means this schema is a JSON object.
          type: "object",

          // properties describe the user fields.
          properties: {
            // userId is the user's id.
            userId: {
              // string means the value is text.
              type: "string",

              // example helps students understand expected output.
              example: "user_1001",
            },

            // email is the user's email.
            email: {
              // string means the value is text.
              type: "string",

              // example matches our demo user.
              example: "student@example.com",
            },

            // role shows how authorization can be added later.
            role: {
              // string means the value is text.
              type: "string",

              // example role for this class.
              example: "student",
            },
          },
        },
      },
    },
  },

  // apis tells swagger-jsdoc where route comments are written.
  apis: ["./src/routes/*.js"],
});


/**
 * @openapi
 * /api/:
 *   get:
 *     summary: Simple string response
 *     description: Returns plain text to show the simplest Express response.
 *     responses:
 *       200:
 *         description: Plain text welcome message
 */
router.get("/", sendWelcomeMessage);

/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: JSON response with status code
 *     description: Returns server health information as JSON.
 *     responses:
 *       200:
 *         description: Server is healthy
 */
router.get("/health", sendHealthStatus);

/**
 * @openapi
 * /api/status-example:
 *   get:
 *     summary: Custom status code response
 *     description: Demonstrates 202 Accepted status code with JSON response.
 *     responses:
 *       202:
 *         description: Request accepted for processing
 */
router.get("/status-example", sendAcceptedStatusExample);

/**
 * @openapi
 * /api/user-info:
 *   get:
 *     summary: JSON user response
 *     description: Demonstrates how APIs commonly return structured JSON data.
 *     responses:
 *       200:
 *         description: User information returned
 */
router.get("/user-info", sendUserInfoAsJson);

/**
 * @openapi
 * /api/search:
 *   get:
 *     summary: GET request with URL query
 *     description: Reads name from query string, for example /api/search?name=Ariful.
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         example: Ariful
 *     responses:
 *       200:
 *         description: Query parameter received
 */
router.get("/search", readNameFromQuery);

/**
 * @openapi
 * /api/client-info:
 *   get:
 *     summary: GET request with header
 *     description: Reads client information from x-client-name header.
 *     parameters:
 *       - in: header
 *         name: x-client-name
 *         schema:
 *           type: string
 *         example: Postman
 *     responses:
 *       200:
 *         description: Header value received
 */
router.get("/client-info", readClientInfoHeaders);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login using POST request
 *     description: Demonstrates POST body, query, headers, JWT cookie, and Redis session.
 *     parameters:
 *       - in: query
 *         name: rememberMe
 *         schema:
 *           type: boolean
 *         example: true
 *       - in: header
 *         name: x-device-name
 *         schema:
 *           type: string
 *         example: Chrome Browser
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful and cookie set
 *       400:
 *         description: Missing email or password
 *       401:
 *         description: Invalid email or password
 */
router.post("/auth/login", authLimiter, loginUser);


/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Get authenticated user
 *     description: Protected route that requires a valid JWT cookie and active Redis session.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Authenticated user profile returned
 *       401:
 *         description: Missing, expired, or invalid authentication
 */
router.get("/auth/me", authMiddleware, getAuthenticatedUser);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Deletes Redis session and clears the JWT cookie.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Missing, expired, or invalid authentication
 */
router.post("/auth/logout", authMiddleware, logoutUser);

export default router;