
const yallist = require('yallist');

const routes = yallist.create([]);

function getRoute(request, options) {
  return routes.toArray().find((route) => route.isRoute(request, options));
}


function registerRoute(route) {
  routes.push(route);
}

module.exports = {
  getRoute,
  registerRoute,
};
