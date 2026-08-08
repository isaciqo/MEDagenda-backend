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
const requestContextMiddleware = require('./src/interfaces/http/middlewares/requestContext');
const setupSwagger = require('./src/interfaces/http/presentation/swagger');
const logger = require('./src/lib/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Render (e a maioria dos PaaS) fica atrás de um proxy reverso — sem isso, req.ip
// mostra o IP interno do proxy, não o do cliente real, quebrando silenciosamente
// os logs, o audit log e o rate limiter (que usa req.ip pra identificar quem é quem).
app.set('trust proxy', 1);

// Precisa ser o primeiríssimo middleware: abre o contexto de request_id que todo o
// resto da requisição herda, inclusive o webhook do Stripe abaixo (registrado antes
// do express.json()) e qualquer erro que aconteça em helmet/cors/rate-limit.
app.use(requestContextMiddleware);

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

// POST /reviews é público (paciente avalia sem login) e não tinha NENHUM rate limit —
// diferente das outras rotas públicas, não vive sob /api/v1/public/, então o
// publicLimiter abaixo não pegava. Mesmo limite generoso o bastante pra um médico
// consultar suas próprias avaliações (GET, autenticado) sem esbarrar nele.
const reviewsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em alguns instantes.' },
});

// /support/send dispara um e-mail de verdade (custo Resend + risco de flag de abuso
// na conta) e só tinha authMiddleware — qualquer conta trial, de graça, conseguia
// martelar esse endpoint sem limite nenhum.
const supportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas solicitações de suporte. Tente novamente mais tarde.' },
});

// /auth/refresh não tinha limite — um refresh token vazado/roubado (vida de 7 dias)
// podia ser usado em loop pra emitir access tokens sem nenhum freio. Limite mais
// folgado que o authLimiter porque várias pessoas atrás do mesmo IP (ex: consultório
// com wifi compartilhado) fazem refresh legítimo com frequência independente umas das outras.
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Aguarde antes de tentar novamente.' },
});

// Guarda-chuva: até agora só rotas específicas tinham limite (login, checkout,
// público, etc) — o resto da API (agenda, pacientes, dashboard, financeiro...)
// não tinha NENHUM teto de frequência além de ter sessão válida. Qualquer conta
// trial gratuita conseguia gerar carga ilimitada nessas rotas (ver
// ANALISE_ABUSO_CUSTO.md, EDoS-02). Limite generoso o bastante pra não incomodar
// uso legítimo — é uma rede de segurança, não a defesa principal; ajustar o
// número conforme dados reais de tráfego em produção.
const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Aguarde antes de tentar novamente.' },
});
app.use('/api/v1', globalApiLimiter);

app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);
app.use('/api/v1/auth/forgot-password', authLimiter);
app.use('/api/v1/auth/refresh', refreshLimiter);
app.use('/api/v1/subscriptions/checkout', checkoutLimiter);
app.use('/api/v1/reviews', reviewsLimiter);
app.use('/api/v1/support/send', supportLimiter);
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
