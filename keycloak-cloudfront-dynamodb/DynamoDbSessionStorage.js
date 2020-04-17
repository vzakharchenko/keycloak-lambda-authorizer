const AWS = require('aws-sdk');


function saveSession(dbSettings) {
  return async (sessionId,
    exp,
    tenant,
    externalToken) => {
    const item = {
      TableName: dbSettings.tableName,
      Item: {
        session: {
          S: sessionId,
        },
        exp: {
          N: String(exp),
        },
      },
    };
    item.Item[tenant] = { S: JSON.stringify(externalToken) };
    await dbSettings.dynamodb.putItem(item).promise();
  };
}

function updateSession(dbSettings) {
  return async (sessionId, tenant, externalToken) => {
    await dbSettings.dynamodb.updateItem({
      TableName: dbSettings.tableName,
      Key: {
        session: { S: sessionId },
      },
      UpdateExpression: `SET ${tenant} = :e`,
      ExpressionAttributeValues: {
        ':e': { S: `${JSON.stringify(externalToken)}` },
      },
    }).promise();
  };
}


function transformResponse(item, tenant) {
  const itemData = {
    session: item.session.S,
    email: item.email.S,
  };

  if (item[tenant]) {
    itemData[tenant] = JSON.parse(item[tenant].S);
  }
  return itemData;
}

function getSessionIfExists(dbSettings) {
  return async (session) => {
    try {
      const data = await dbSettings.dynamodb.getItem({
        TableName: dbSettings.tableName,
        Key: {
          session: { S: session },
        },
      }).promise();
      console.debug(`session: ${JSON.stringify(data)}`);
      const item = data.Item;
      return !item
      || (
        Object.keys(item).length === 0
          && item.constructor === Object) ? null : transformResponse(item);
    } catch (e) {
      console.log(e);
      return null;
    }
  };
}

async function deleteSession(dbSettings) {
  return async (session) => {
    try {
      await dbSettings.dynamodb.deleteItem({
        TableName: dbSettings.tableName,
        Key: {
          session: { S: session },
        },
      }).promise();
    } catch (e) {
      console.log(e);
    }
  };
}

function DynamoDbSessionStorage(awsConfig, tableName) {
  AWS.config.update(awsConfig);
  const dynamodb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });
  const dbSettings = { dynamodb, tableName };
  return {
    saveSession: saveSession(dbSettings),
    updateSession: updateSession(dbSettings),
    getSessionIfExists: getSessionIfExists(dbSettings),
    deleteSession: deleteSession(dbSettings),
  };
}

module.exports = {
  DynamoDbSessionStorage,
};
