const { getRoute } = require('./router');

const { updateResponse } = require('./lambdaEdgeUtils');
const routes = require('./routes/routes');
const { lambdaEdgeOptions } = require('../utils/optionsUtils');

async function lambdaEdgeRouter(event, context, sessionManager, callback) {
  const records = event.Records;
  const options = lambdaEdgeOptions(sessionManager);
  if (records && records[0] && records[0].cf) {
    const { request } = records[0].cf;
    const route = getRoute(request, options);
    try {
      await route.handle(request, (error, response) => {
        updateResponse(request, response);
        callback(error, response);
      }, options);
    } catch (e) {
      console.error(e);
      options.route.internalServerError(request, callback);
    }
  } else {
    options.route.internalServerError(request, callback);
  }
}

module.exports = {
  routes,
  lambdaEdgeRouter,

};
