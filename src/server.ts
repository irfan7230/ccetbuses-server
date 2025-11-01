import express, { Application } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';

import config from './config';
import logger from './utils/logger';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import SocketHandler from './sockets';
import locationService from './services/locationService';

class Server {
  private app: Application;
  private httpServer: http.Server;
  private socketHandler: SocketHandler;

  constructor() {
    this.app = express();
    this.httpServer = http.createServer(this.app);
    this.socketHandler = new SocketHandler(this.httpServer);

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeCronJobs();
  }

  // Getter for Socket.io handler (used internally)
  public getSocketHandler(): SocketHandler {
    return this.socketHandler;
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet());

    // CORS configuration
    this.app.use(
      cors({
        origin: config.allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      })
    );

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // HTTP request logging
    this.app.use(
      morgan('combined', {
        stream: logger.stream as any,
      })
    );

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.maxRequests,
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });

    this.app.use('/api/', limiter);

    logger.info('Middleware initialized');
  }

  private initializeRoutes(): void {
    // API routes
    this.app.use('/api', routes);

    // Root endpoint
    this.app.get('/', (_req, res) => {
      res.json({
        message: 'Sundhara Travels API',
        version: '1.0.0',
        status: 'running',
        documentation: '/api/health',
      });
    });

    logger.info('Routes initialized');
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);

    logger.info('Error handling initialized');
  }

  private initializeCronJobs(): void {
    // Clean up inactive bus locations every 5 minutes
    cron.schedule('*/5 * * * *', () => {
      logger.info('Running cleanup job for inactive locations');
      locationService.clearInactiveLocations();
    });

    logger.info('Cron jobs initialized');
  }

  public start(): void {
    this.httpServer.listen(config.port, config.host, () => {
      logger.info(`
        ╔═══════════════════════════════════════════════════════╗
        ║                                                       ║
        ║   🚌  Sundhara Travels Server                        ║
        ║                                                       ║
        ║   Environment: ${config.env.padEnd(35)}║
        ║   Server:      http://${config.host}:${config.port}${' '.repeat(20)}║
        ║   Socket.io:   Ready for real-time connections       ║
        ║                                                       ║
        ╚═══════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  private shutdown(): void {
    logger.info('Shutting down server gracefully...');

    this.httpServer.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown');
      process.exit(1);
    }, 10000);
  }
}

// Start the server
const server = new Server();
server.start();

export default server;
