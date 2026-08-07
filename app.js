require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const connectDatabase = require('./src/database/connection');
const container = require('./src/interfaces/http/container');
const routerRegister = require('./src/interfaces/http/presentation/RouterRegister');
const errorHandler = require('./src/interfaces/http/middlewares/errorHandler');
const requestLogger = require('./src/interfaces/http/middlewares/requestLogger');
const setupSwagger = require('./src/interfaces/http/presentation/swagger');
const logger = require('./src/lib/logger');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());

// Stripe webhook must receive raw body — register before express.json()
app.post('/api/v1/webhooks/stripe', express.raw({ type: 'application/json' }), (req, res, next) => {
  const operation = container.resolve('handleStripeWebhookOperation');
  Promise.resolve(operation.execute(req.body, req.headers['stripe-signature']))
    .then(() => res.status(200).json({ received: true }))
    .catch(next);
});

app.use(express.json());
app.use(requestLogger);

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:8080'];

app.use(cors({
  origin: (origin, callback) => {
    // Em produção, bloqueia requests sem Origin; em dev/test permite (Postman, curl)
    if (!origin) {
      if (process.env.NODE_ENV === 'production') {
        return callback(new Error('CORS: requisições sem Origin não são permitidas em produção'));
      }
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origem não permitida — ${origin}`));
  },
  credentials: true,
}));

// Health check — sem auth, sem depender do banco, usado como keep-alive/monitoramento.
// Registrado depois do cors() para receber os headers de Access-Control-Allow-Origin.
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Aguarde 15 minutos antes de tentar novamente.' },
});

const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em alguns instantes.' },
});

const checkoutLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de checkout. Aguarde antes de tentar novamente.' },
});

app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);
app.use('/api/v1/auth/forgot-password', authLimiter);
app.use('/api/v1/subscriptions/checkout', checkoutLimiter);
app.use('/api/v1/public/', publicLimiter);

setupSwagger(app);
routerRegister(app, container);
app.use(errorHandler);

connectDatabase()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Swagger docs: http://localhost:${PORT}/api-docs`);
    });

    // Roda todos os dias às 09:00 horário de Brasília
    cron.schedule('0 9 * * *', async () => {
      try {
        const job = container.resolve('trialWarningJob');
        await job.run();
      } catch (err) {
        logger.error('TrialWarningJob: erro ao executar cron', { message: err.message });
      }
    }, { timezone: 'America/Sao_Paulo' });
    logger.info('Cron: TrialWarningJob agendado para 09:00 BRT diariamente');
  })
  .catch((err) => {
    logger.error('Failed to connect to database', { message: err.message, stack: err.stack });
    process.exit(1);
  });

module.exports = app;
