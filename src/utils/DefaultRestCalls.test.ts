/* eslint-disable require-await, @typescript-eslint/ban-ts-comment
 */
import fetch from 'axios';

import {DefaultRestCalls} from "./DefaultRestCalls";

jest.mock('axios');

describe('DefaultRestCalls tests', () => {
  beforeEach(async () => {
    // @ts-ignore
    fetch.mockImplementation(async (t:any) => {
      t.transformResponse({});
      return {data: 'test'};
    });
  });

  test('DefaultRestCalls fetchData', async () => {
    const restCalls = new DefaultRestCalls();
    expect(await restCalls.fetchData('1', 'GET')).toEqual('test');
  });

  test('DefaultRestCalls sendData', async () => {
    const restCalls = new DefaultRestCalls();
    expect(await restCalls.sendData('1', 'POST', 'test')).toEqual('test');
  });

});
