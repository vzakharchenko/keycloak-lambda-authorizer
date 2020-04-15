const webpack = require('webpack');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');

const path = require('path');

const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';

const config = {
  mode: env,
  context: __dirname,
  entry: {
    index: path.join(__dirname, 'src/index.js'),
  },
  target: 'node',
  node: {
    __dirname: false,
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'index.js',
    libraryTarget: 'commonjs-module',
    library: 'authorization',
  },
  module: {
    rules: [{
      test: /\.(js|jsx)$/,
      use: ['babel-loader'],
    },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      '.': '__dirname',
    }),
    new webpack.optimize.ModuleConcatenationPlugin(),
    new ProgressBarPlugin(),
  ],
  resolve: {
    alias:
        {'keycloak-lambda-authorizer':'../../..'},
    modules: [
      path.join(__dirname, 'src'),
      'node_modules',
    ],
  },
  stats: {
    colors: true,
  },
  devtool: false,
};

module.exports = config;
