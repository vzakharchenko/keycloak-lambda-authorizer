import fs from 'fs';

function getPolicyDocument(name:string) {
  try {
    return JSON.parse(fs.readFileSync(`${__dirname}/policy${name}Document.json`, 'utf8'));
  } catch (e:any) {
    if (e.code === 'ENOENT') {
      console.error(`Expected policy${name}Document.json to be included in Lambda deployment package`);
      // fallthrough
    }
    throw e;
  }
}

// extract user_id from the autho0 userInfo and return it for AWS principalId
async function getPrincipalId(userInfo:any) {
  if (!userInfo || (!userInfo.email && !userInfo.preferred_username)) {
    throw new Error('No email returned from authentication service');
  }
  console.info(`authentication successful for user ${userInfo.email || userInfo.preferred_username}`);

  return userInfo.email || userInfo.preferred_username;
}

async function getUserInfo(jwt:any) {
  if (!jwt) {
    throw new Error('data empty return');
  }
  if (jwt === 'Unauthorized') {
    throw new Error('Unauthorized');
  }
  const user:any = {};
  user.name = jwt.name;
  user.email = jwt.email;
  user.preferred_username = jwt.preferred_username;
  user.given_name = jwt.given_name;
  user.family_name = jwt.family_name;
  const principalId = await getPrincipalId(jwt);
  if (!principalId) {
    return null;
  }
  user.principalId = principalId;
  return user;
}

export async function getAuthentication(jwt:any, name:string) {
  const userInfo = await getUserInfo(jwt);
  return {
    principalId: userInfo.principalId,
    policyDocument: getPolicyDocument(name),
    context: userInfo,
  };
}
