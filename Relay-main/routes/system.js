/**
 * This file exists solely to hold @openapi JSDoc annotations for endpoints
 * that are defined directly in server.js (outside the routes/ directory).
 * swagger-jsdoc cannot reliably parse the same file that calls swaggerJsdoc(),
 * so these docs live here instead.
 */

/**
 * @openapi
 * /:
 *   get:
 *     tags: [System]
 *     summary: API Root Information
 *     description: Returns basic service information and versioning.
 *     security: []
 *     responses:
 *       200: { description: API info }
 */
/**
 * @openapi
 * /health:
 *   get:
 *     tags: [System]
 *     summary: Health check
 *     description: Returns the current health and uptime of the API server. No authentication required.
 *     security: []
 *     responses:
 *       200: { description: API is healthy }
 */

// No routes are exported — this file is only scanned for OpenAPI docs
