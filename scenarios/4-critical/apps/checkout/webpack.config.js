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
      name: 'checkout',
      filename: 'remoteEntry.js',
      exposes: { './Cart': './src/Cart' },
      shared: {
        // CRITICAL: stale React 16 — same pattern as catalog, copy-paste from old config
        react: { singleton: true, requiredVersion: deps.react, eager: true },
        'react-dom': { singleton: true, requiredVersion: deps['react-dom'], eager: true },
        // CRITICAL: React Router v5 declared + eager without singleton
        'react-router-dom': { requiredVersion: deps['react-router-dom'], eager: true },
        // CRITICAL: Zustand v3 — store API incompatible with v4
        zustand: { singleton: true, requiredVersion: deps.zustand, eager: true },
      },
    }),
    new HtmlWebpackPlugin({ template: './public/index.html' }),
  ],
  devServer: { port: 3002, historyApiFallback: true },
  output: { publicPath: 'http://localhost:3002/', clean: true },
};
