const NodeCache = require('node-cache');

const defaultCache = new NodeCache({ stdTTL: 180, checkperiod: 0, errorOnMissing: false });
const resourceCache = new NodeCache({ stdTTL: 30, checkperiod: 0, errorOnMissing: false });

function put(region, key, value) {
  if (region === 'publicKey') {
    defaultCache.set(key, value);
  } else if (region === 'uma2-configuration') {
    defaultCache.set(key, value);
  } else if (region === 'client_credentials') {
    defaultCache.set(key, value);
  } else if (region === 'resource') {
    resourceCache.set(key, value);
  } else {
    throw new Error('Unsupported Region');
  }
}

function get(region, key) {
  if (region === 'publicKey') {
    return defaultCache.get(key);
  } if (region === 'uma2-configuration') {
    return defaultCache.get(key);
  } if (region === 'client_credentials') {
    return defaultCache.get(key);
  } if (region === 'resource') {
    return resourceCache.get(key);
  }
  throw new Error('Unsupported Region');
}

module.exports = {
  put,
  get,
};
