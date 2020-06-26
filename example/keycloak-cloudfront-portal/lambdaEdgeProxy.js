import { lambda } from 'lambda-edge-example';

function splitUrl(url) {
  if (url.indexOf('?') <= 0) {
    return {
      uri: url,
      querystring: '',
    };
  }
  const querystring = url.substr(url.indexOf('?') + 1, url.length);
  return {
    uri: url.substr(0, url.indexOf('?')),
    querystring,
  };
}

function transformRequest(req) {
  const urlQuery = splitUrl(req.originalUrl);
  const headers = {};
  Object.keys(req.headers).forEach((headerName) => {
    const headerValue = req.headers[headerName];
    headers[headerName] = [{
      key: headerName,
      value: headerValue,
    }];
  });
  headers.referer = [
    {
      key: 'Referer',
      value: `http://${req.headers.host}`,
    },
  ];
  return {
    localhost: true,
    Records: [
      {
        cf: {
          config: {
            distributionId: 'EXAMPLE',
            eventType: 'local-request',
          },
          request: {
            uri: urlQuery.uri,
            querystring: urlQuery.querystring,
            method: req.method,
            clientIp: '2001:cdba::3257:9652',
            headers,
          },
        },
      },
    ],
  };
}

function transformResponse(response, res, next) {
  if (response.clientIp && response.method) {
    next();
  } else {
    const resHeader = res.status(response.status);
    if (response.headers) {
      Object.keys(response.headers).forEach((headerName) => {
        const headers = {};
        response.headers[headerName].forEach((hn) => {
          if (headers[hn.key]) {
            headers[hn.key].push(hn.value);
          } else {
            headers[hn.key] = [hn.value];
          }
        });
        Object.keys(headers).forEach((hn) => {
          resHeader.set(hn, headers[hn]);
        });
      });
    }
    res.send(response.body);
  }
}

module.exports.middleware = async (req, res, next) => {
  const cb = function callback(error, r) {
    if (error) {
      throw new Error(error);
    }
    transformResponse(r, res, next);
  };
  await lambda(transformRequest(req), {}, cb);
};
