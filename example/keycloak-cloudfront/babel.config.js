module.exports = function (api) {
  api.cache(true);

  const presets = [
    [
      '@babel/preset-env',
      {
        targets: {
          esmodules: true,
        },
      },
    ],
    ['@babel/preset-react'],
    ['@babel/preset-flow']
  ];

  const plugins = [
    ['@babel/transform-runtime', {
      helpers: false,
      regenerator: true,
    }],
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    '@babel/plugin-transform-object-assign',
    '@babel/plugin-proposal-do-expressions',
    '@babel/plugin-proposal-export-default-from',
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-proposal-function-sent',
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-proposal-partial-application',
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
