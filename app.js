require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDatabase = require('./src/database/connection');
const container = require('./src/interfaces/http/container');
const routerRegister = require('./src/interfaces/http/presentation/RouterRegister');
const errorHandler = require('./src/interfaces/http/middlewares/errorHandler');
const setupSwagger = require('./src/interfaces/http/presentation/swagger');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

setupSwagger(app);
routerRegister(app, container);
app.use(errorHandler);

connectDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
  });
});

module.exports = app;
