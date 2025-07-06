import express from 'express';
import { healthController } from '../../controllers';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: Health check and system status endpoints
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     description: Check the health status of the API and its dependencies including database connectivity.
 *     tags: [Health]
 *     responses:
 *       "200":
 *         description: System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 *             example:
 *               status: "ok"
 *               timestamp: "2023-01-01T00:00:00.000Z"
 *               uptime: 3600
 *               database: "connected"
 *               version: "1.0.0"
 *               environment: "development"
 *       "503":
 *         description: System is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-01-01T00:00:00.000Z"
 *                 uptime:
 *                   type: number
 *                   example: 3600
 *                 database:
 *                   type: string
 *                   example: "disconnected"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 environment:
 *                   type: string
 *                   example: "development"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 */
router.get('/', healthController.healthCheck);

export default router; 