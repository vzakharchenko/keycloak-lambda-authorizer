/* eslint-disable require-await, @typescript-eslint/ban-ts-comment
 */
import {isExpired} from "./TokenUtils";

describe('TokenUtils tests', () => {
  beforeEach(async () => {
    // @ts-ignore
  });

  test('test isExpired', async () => {
    expect(isExpired({exp: Math.floor(Date.now() / 1000) + 100})).toEqual(false);
  });
  test('test isExpired', async () => {
    expect(isExpired({exp: 1})).toEqual(true);
  });

});
