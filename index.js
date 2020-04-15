const apigateway = require('./src/apigateway/apigateway');
const adapter = require('./src/adapter/adapter');
const lamdaEdge = require('./src/edge/lamdaEdge');

module.exports = {
  apigateway, adapter, lamdaEdge,
};
