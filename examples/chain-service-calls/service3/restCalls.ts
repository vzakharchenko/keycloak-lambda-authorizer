import fetch, { Method } from 'axios';

fetch.interceptors.response.use((response) => response, (error) => error);

export async function fetchData(url:string, method:Method = 'GET', headers?:any) {
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

export async function sendData(url:string, method:Method = 'POST', data:string, headers?:any) {
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
