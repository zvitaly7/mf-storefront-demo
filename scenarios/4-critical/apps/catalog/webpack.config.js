const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;
const deps = require('./package.json').dependencies;

module.exports = {
  entry: './src/index.tsx',
  resolve: { extensions: ['.tsx', '.ts', '.js'] },
  module: {
    rules: [
      { test: /\.tsx?$/, use: 'ts-loader', exclude: /node_modules/ },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'catalog',
      filename: 'remoteEntry.js',
      exposes: { './ProductList': './src/ProductList' },
      shared: {
        // CRITICAL: stale React 16 — never updated when migrating to React 18
        react: { singleton: true, requiredVersion: deps.react },
        'react-dom': { singleton: true, requiredVersion: deps['react-dom'] },
        // CRITICAL: React Router v5 declared + eager without singleton → triple failure
        'react-router-dom': { requiredVersion: deps['react-router-dom'], eager: true },
        // CRITICAL: Zustand v3 declared — also unused in this app (shared for no reason)
        zustand: { singleton: true, requiredVersion: deps.zustand },
      },
    }),
    new HtmlWebpackPlugin({ template: './public/index.html' }),
  ],
  devServer: { port: 3001, historyApiFallback: true },
  output: { publicPath: 'http://localhost:3001/', clean: true },
};
