const fs = require('fs');

async function readStorage() {
  try {
    return (await fs.promises.readFile('./storage.json')).toString('utf8');
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.log('Expected storage.json to be included in Lambda deployment package');
      // fallthrough
    }
    return '{}';
  }
}

async function saveStorage(storage) {
  try {
    await fs.promises.writeFile('./storage.json', JSON.stringify(storage));
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.log('Expected storage.json to be included in Lambda deployment package');
      // fallthrough
    }
    throw new Error(e);
  }
}

async function updateStorage() {
  const timeLocal = new Date().getTime();
  const timeSec = Math.floor(timeLocal / 1000);
  const jsonFile = await readStorage();
  const json = JSON.parse(jsonFile);
  Object.keys(json).forEach((sessionId) => {
    const { exp } = json[sessionId];
    if (exp < timeSec) {
      delete json[sessionId];
    }
  });
  await saveStorage(json);
  return json;
}

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
  const inMemory = await updateStorage();
  tenantJson[tenant] = externalToken;
  inMemory[sessionId] = tenantJson;
  await saveStorage(inMemory);
}

async function updateSession(sessionId, tenant, externalToken) {
  const inMemory = await updateStorage();
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
  await saveStorage(inMemory);
}

async function getSessionIfExists(session) {
  const inMemory = await updateStorage();
  return inMemory[session];
}

async function deleteSession(session) {
  const inMemory = await updateStorage();
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
