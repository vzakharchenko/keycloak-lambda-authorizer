jest.mock('fs');
const { LocalSessionStorage } = require('../../../../src/edge/storage/localSessionStorage');

const storage = new LocalSessionStorage();

describe('testing localSessionStorageTest', () => {
  beforeEach(() => {

  });

  afterEach(() => {
  });

  test('test saveSession', async () => {
    await storage.saveSession('sessionId');
  });

  test('test updateSession', async () => {
    await storage.updateSession('sessionId', 'tenant', 'token');
  });
  test('test getSessionIfExists ', async () => {
    await storage.getSessionIfExists('sessionId');
  });
  test('test deleteSession ', async () => {
    await storage.deleteSession('sessionId');
  });
});
