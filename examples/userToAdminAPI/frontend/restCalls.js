const fetch = require('axios');

fetch.interceptors.response.use((response) => response, (error) => error);

function fetchData(url, method = 'GET', headers) {
  return new Promise((resolve, reject) => {
    fetch({
      url,
      method,
      headers,
      transformResponse: (req) => req,
      withCredentials: true,
      timeout: 29000,
    }).then((response) => {
      if (response.isAxiosError) {
        reject(response.message);
      }
      resolve(response.data);
    }).catch((response) => {
      reject(response);
    });
  });
}

function sendData(url, method = 'POST', data, headers) {
  return new Promise((resolve, reject) => {
    fetch({
      url,
      method,
      data,
      headers,
      transformResponse: (req) => req,
      withCredentials: true,
      timeout: 29000,
    }).then((response) => {
      if (response.isAxiosError) {
        reject(response.message);
      }
      resolve(response.data);
    }).catch((response) => {
      reject(response);
    });
  });
}

module.exports = {
  fetchData,
  sendData,
};
