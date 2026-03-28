const authRoutes = require('./auth/authRoutes');
const publicRoutes = require('./public/publicRoutes');
const appointmentRoutes = require('./appointment/appointmentRoutes');
const financialRoutes = require('./financial/financialRoutes');
const reviewRoutes = require('./review/reviewRoutes');
const dashboardRoutes = require('./dashboard/dashboardRoutes');
const availabilityRoutes = require('./availability/availabilityRoutes');
const settingsRoutes = require('./settings/settingsRoutes');
const validationMiddleware = require('../middlewares/validationMiddleware');

const API_PREFIX = '/api/v1';

const registerRoutes = (app, routes, container) => {
  routes.forEach(route => {
    const [controllerName, methodName] = route.handler.split('.');
    const controller = container.resolve(controllerName);

    const middlewares = route.middlewares || [];
    const validate = validationMiddleware(route.validation);
    const fullPath = `${API_PREFIX}${route.path}`;

    app[route.method](fullPath, ...middlewares, validate, (req, res, next) => {
      Promise.resolve(controller[methodName](req, res, next)).catch(next);
    });
  });
};

const routerRegister = (app, container) => {
  registerRoutes(app, authRoutes, container);
  registerRoutes(app, publicRoutes, container);
  registerRoutes(app, appointmentRoutes, container);
  registerRoutes(app, financialRoutes, container);
  registerRoutes(app, reviewRoutes, container);
  registerRoutes(app, dashboardRoutes, container);
  registerRoutes(app, availabilityRoutes, container);
  registerRoutes(app, settingsRoutes, container);
};

module.exports = routerRegister;
