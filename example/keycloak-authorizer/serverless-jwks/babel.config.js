module.exports = function (api) {
  api.cache(true);

  const presets = [
    [
      "@babel/preset-env",
    ]
  ];
  const plugins = [
    ['@babel/transform-runtime', {
      helpers: false,
      regenerator: false,
    }],
    ['@babel/plugin-proposal-decorators', { decoratorsBeforeExport: true }],
    ['@babel/plugin-proposal-object-rest-spread'],
    ['@babel/plugin-transform-async-to-generator'],
  ];

  if (process.env.NODE_ENV === 'test') {
    plugins.push('babel-plugin-dynamic-import-node');
  } else {
    plugins.push('@babel/plugin-syntax-dynamic-import');
  }

  return {
    presets,
    plugins,
  };
};
