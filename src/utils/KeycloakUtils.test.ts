/* eslint-disable require-await, @typescript-eslint/ban-ts-comment
 */
import {getKeycloakUrl} from "./KeycloakUtils";

describe('KeycloakUtils tests', () => {
  beforeEach(async () => {
    // @ts-ignore
  });

  test('getKeycloakUrl test', async () => {
    // @ts-ignore
    const url = getKeycloakUrl({'auth-server-url': 'http://url.com'});
    expect(url).toEqual('http://url.com');
  });

  test('getKeycloakUrl test 2', async () => {
    // @ts-ignore
    const url = getKeycloakUrl({'auth-server-url': 'http://url.com/'});
    expect(url).toEqual('http://url.com');
  });
});
