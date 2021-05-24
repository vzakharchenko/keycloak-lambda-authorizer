const NodeCache = require('node-cache');

const defaultCache = new NodeCache({ stdTTL: 180, errorOnMissing: false });
const rptCache = new NodeCache({ stdTTL: 1800, errorOnMissing: false });
const resourceCache = new NodeCache({ stdTTL: 30, errorOnMissing: false });

async function put(region, key, value, ttl) {
  if (region === 'publicKey') {
    defaultCache.set(key, value, ttl);
  } else if (region === 'uma2-configuration') {
    defaultCache.set(key, value, ttl);
  } else if (region === 'client_credentials') {
    defaultCache.set(key, value, ttl);
  } else if (region === 'resource') {
    resourceCache.set(key, value, ttl);
  } else if (region === 'rpt') {
    rptCache.set(key, value, ttl);
  } else {
    throw new Error('Unsupported Region');
  }
}

async function get(region, key) {
  // return null;
  if (region === 'publicKey') {
    return defaultCache.get(key);
  } if (region === 'uma2-configuration') {
    return defaultCache.get(key);
  } if (region === 'client_credentials') {
    return defaultCache.get(key);
  } if (region === 'resource') {
    return resourceCache.get(key);
  } if (region === 'rpt') {
    return rptCache.get(key);
  }
  throw new Error('Unsupported Region');
}

module.exports = {
  put,
  get,
};
