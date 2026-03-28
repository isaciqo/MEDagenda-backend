const swaggerUi = require('swagger-ui-express');
const authRoutes = require('./auth/authRoutes');
const appointmentRoutes = require('./appointment/appointmentRoutes');
const financialRoutes = require('./financial/financialRoutes');
const reviewRoutes = require('./review/reviewRoutes');
const dashboardRoutes = require('./dashboard/dashboardRoutes');
const availabilityRoutes = require('./availability/availabilityRoutes');
const settingsRoutes = require('./settings/settingsRoutes');

const API_PREFIX = '/api/v1';

const buildSwaggerSpec = () => {
  const paths = {};

  const allRoutes = [
    ...authRoutes,
    ...appointmentRoutes,
    ...financialRoutes,
    ...reviewRoutes,
    ...dashboardRoutes,
    ...availabilityRoutes,
    ...settingsRoutes,
  ];

  allRoutes.forEach(route => {
    const swaggerPath = `${API_PREFIX}${route.path}`.replace(/:(\w+)/g, '{$1}');
    if (!paths[swaggerPath]) paths[swaggerPath] = {};

    paths[swaggerPath][route.method] = route.swagger || {
      tags: [route.path.split('/')[1]],
      summary: `${route.method.toUpperCase()} ${route.path}`,
      responses: { 200: { description: 'Success' } },
    };
  });

  return {
    openapi: '3.0.0',
    info: {
      title: 'MedAgenda API',
      version: '1.0.0',
      description: 'API para gerenciamento de consultas médicas',
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    paths,
  };
};

const setupSwagger = (app) => {
  const spec = buildSwaggerSpec();
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec));
  app.get('/api-docs.json', (req, res) => res.json(spec));
};

module.exports = setupSwagger;
