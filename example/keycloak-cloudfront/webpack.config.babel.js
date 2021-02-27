const webpack = require('webpack');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';

const config = {
  mode: env,
  entry: {
    main: path.join(__dirname, 'src'),
  },
  target: 'web',
  output: {
    filename: '[name].bundle.js',
    path: path.join(__dirname, 'public'),
    publicPath: '/',
  },
  devServer: {
    contentBase: 'public',
    historyApiFallback: true,
    hot: false,
    inline: false,
    host: '0.0.0.0',
    disableHostCheck: true,
    before(app) {
      // eslint-disable-next-line global-require
      const { middleware } = require('./lambdaEdgeProxy');

      app.use('/*', middleware);
    },
  },
  module: {
    rules: [{
      test: /\.(js|jsx)$/,
      use: ['babel-loader'],
    },
    {
      test: /\.scss$/,
      use: [
        'style-loader',
        'css-loader',
        'sass-loader',
      ],
    },
    {
      test: /\.css$/,
      // exclude: /node_modules/,
      use: [
        'style-loader',
        'css-loader',
      ],
    },
    {
      test: /\.(jpe?g|png|gif|svg)$/i,
      use: [
        {
          loader: 'file-loader',
          options: {
            hash: 'sha512',
            digest: 'hex',
            name: 'img/[name].[ext]',
          },
        },
      ],
    },
    {
      test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
      use: [
        {
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: 'fonts/',
          },
        },
      ],
    },
    ],
  },
  plugins: [
    new ProgressBarPlugin(),
    new HtmlWebpackPlugin({
      template: 'tenant1.html',
      filename: 'tenant1.html',
    }),
    new HtmlWebpackPlugin({
      template: 'tenant2.html',
      filename: 'tenant2.html',
    }),
    new HtmlWebpackPlugin({
      template: 'index.html',
      filename: 'index.html',
    }),
  ],
  resolve: {
    alias: {
      'lambda-edge-example': path.resolve(__dirname, './lambda-edge-example'),
      crypto: path.resolve(__dirname, './node_modules/crypto-js'),
    },
    modules: [
      path.join(__dirname, 'src', 'app'),
      path.join(__dirname),
      'node_modules',
    ],
  },
  stats: {
    colors: true,
  },
  devtool: 'source-map',
};

module.exports = config;
