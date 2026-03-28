const awilix = require('awilix');
const { InjectionMode, asClass, asValue } = awilix;

const container = awilix.createContainer({ injectionMode: InjectionMode.PROXY });

container.loadModules(
  [
    'src/app/operations/**/*.js',
    'src/app/services/**/*.js',
    'src/infrastructure/repositories/**/*.js',
    'src/interfaces/http/presentation/**/*Controller.js',
  ],
  {
    formatName: 'camelCase',
    resolverOptions: {
      injectionMode: InjectionMode.PROXY,
      lifetime: awilix.Lifetime.SINGLETON,
    },
  }
);

module.exports = container;
