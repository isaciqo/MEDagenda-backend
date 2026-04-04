require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDatabase = require('./src/database/connection');
const container = require('./src/interfaces/http/container');
const routerRegister = require('./src/interfaces/http/presentation/RouterRegister');
const errorHandler = require('./src/interfaces/http/middlewares/errorHandler');
const setupSwagger = require('./src/interfaces/http/presentation/swagger');
const logger = require('./src/lib/logger');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:8080'];

app.use(cors({
  origin: (origin, callback) => {
    // permite requests sem origin (ex: mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origem não permitida — ${origin}`));
  },
  credentials: true,
}));

setupSwagger(app);
routerRegister(app, container);
app.use(errorHandler);

connectDatabase()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Swagger docs: http://localhost:${PORT}/api-docs`);
    });
  })
  .catch((err) => {
    logger.error('Failed to connect to database', { message: err.message, stack: err.stack });
    process.exit(1);
  });

module.exports = app;
