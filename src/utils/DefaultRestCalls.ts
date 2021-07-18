import fetch from 'axios';

import {HTTPMethod, RestCalls} from './restCalls';

export class DefaultRestCalls implements RestCalls {
  async fetchData(url: string, method: HTTPMethod, headers?: any): Promise<string> {
    const ret = await fetch({
      url,
      method,
      headers,
      transformResponse: (req) => req,
      withCredentials: true,
      timeout: 29000,
    });
    return ret.data;
  }

  async sendData(url: string, method: HTTPMethod, data: string, headers?: any): Promise<string> {
    const ret = await fetch({
      url,
      method,
      data,
      transformResponse: (req) => req,
      headers,
      withCredentials: true,
      timeout: 29000,
    });
    return ret.data;
  }
}
