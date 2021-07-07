const apigateway = require('./src/apigateway/apigateway');
const adapter = require('./src/adapter/adapter');
const { middlewareAdapter } = require('./src/adapter/middlewareAdapter');

module.exports = {
  apigateway, adapter, middlewareAdapter,
};
