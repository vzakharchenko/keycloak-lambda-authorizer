const fs = require('fs');

function readStorage() {
  try {
    return fs.readFileSync('./storage.json');
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.log('Expected storage.json to be included in Lambda deployment package');
      // fallthrough
    }
    return '{}';
  }
}

function saveStorage(storage) {
  try {
    fs.writeFileSync('./storage.json', JSON.stringify(storage));
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.log('Expected storage.json to be included in Lambda deployment package');
      // fallthrough
    }
    throw new Error(e);
  }
}

function updateStorage() {
  const timeLocal = new Date().getTime();
  const timeSec = Math.floor(timeLocal / 1000);
  const jsonFile = readStorage();
  const json = JSON.parse(jsonFile);
  Object.keys(json).forEach((sessionId) => {
    const { exp } = json[sessionId];
    if (exp < timeSec) {
      delete json[sessionId];
    }
  });
  saveStorage(json);
  return json;
}


const inMemory = updateStorage();

async function saveSession(
  sessionId,
  exp,
  tenant,
  externalToken,
) {
  const tenantJson = {
    session: sessionId,
    exp,
  };
  tenantJson[tenant] = externalToken;
  inMemory[sessionId] = tenantJson;
  saveStorage(inMemory);
}

async function updateSession(sessionId, tenant, externalToken) {
  const sessionObject = inMemory[sessionId];
  if (sessionObject) {
    sessionObject[tenant] = externalToken;
  } else {
    const json = {
      session: sessionId,
    };
    json[tenant] = externalToken;
    inMemory[sessionId] = json;
  }
  saveStorage(inMemory);
}

async function getSessionIfExists(session) {
  return inMemory[session];
}

async function deleteSession(session) {
  delete inMemory[session];
}

function LocalSessionStorage() {
  return {
    saveSession,
    updateSession,
    getSessionIfExists,
    deleteSession,
  };
}

module.exports = {
  LocalSessionStorage,
};
