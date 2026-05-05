const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const { ModuleFederationPlugin } = require('webpack').container;
const deps = require('./package.json').dependencies;

module.exports = {
  entry: './src/index.tsx',
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  module: {
    rules: [
      { test: /\.tsx?$/, use: 'ts-loader', exclude: /node_modules/ },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'shell',
      remotes: {
        catalog:  'catalog@http://localhost:3001/remoteEntry.js',
        checkout: 'checkout@http://localhost:3002/remoteEntry.js',
      },
      // Polyrepo composition: only runtime primitives (React + router) are
      // shared. Remotes bundle their own mf-bridge / mf-ssr copies — no
      // correctness impact because DOMEventBus dispatches through CustomEvent
      // on the DOM, which natively crosses bundle boundaries.
      shared: {
        react:              { singleton: true, requiredVersion: deps.react,              eager: true },
        'react-dom':        { singleton: true, requiredVersion: deps['react-dom'],       eager: true },
        'react-router-dom': { singleton: true, requiredVersion: deps['react-router-dom'], eager: true },
      },
    }),
    // Webpack 5 does not inline `process.env.*` automatically (unlike webpack 4).
    // Inline build-time env values consumed by the client bundle here.
    new webpack.DefinePlugin({
      'process.env.CHECKOUT_FRAGMENT_URL': JSON.stringify(
        process.env.CHECKOUT_FRAGMENT_URL ?? null,
      ),
    }),
    new HtmlWebpackPlugin({ template: './public/index.html' }),
  ],
  devServer: { port: 3000, historyApiFallback: true },
  output: { publicPath: 'http://localhost:3000/', clean: true },
};
