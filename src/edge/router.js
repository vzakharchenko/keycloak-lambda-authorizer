const yallist = require('yallist');

const routes = yallist.create([]);

async function getRoute(request, options) {
  const array = routes.toArray();
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < array.length; i++) {
    // eslint-disable-next-line no-await-in-loop
    const ret = await array[i].isRoute(request, options);
    if (ret) {
      return array[i];
    }
  }
  return null;
}

function registerRoute(route) {
  routes.push(route);
}

module.exports = {
  getRoute,
  registerRoute,
};
