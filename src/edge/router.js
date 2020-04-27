
const yallist = require('yallist');

const routes = yallist.create([]);

async function getRoute(request, options) {
  return routes.toArray().find(async (route) => await route.isRoute(request, options));
}


function registerRoute(route) {
  routes.push(route);
}

module.exports = {
  getRoute,
  registerRoute,
};
