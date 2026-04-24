const HtmlWebpackPlugin = require('html-webpack-plugin');
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
      name: 'checkout',
      filename: 'remoteEntry.js',
      // URL Mode: this webpack build produces the client-side bundle for the
      // remote — only the hydration entry is exposed. The SSR fragment lives
      // in ./server/ and is bundled separately for Node/edge runtimes (not
      // part of webpack MF).
      exposes: {
        './hydrate': './src/hydrate',
      },
      // Remotes keep mf-bridge bundled internally. Not sharing is fine:
      // DOMEventBus dispatches through CustomEvent on the DOM, which crosses
      // bundle boundaries natively through the Web platform.
      shared: {
        react:              { singleton: true, requiredVersion: deps.react },
        'react-dom':        { singleton: true, requiredVersion: deps['react-dom'] },
        'react-router-dom': { singleton: true, requiredVersion: deps['react-router-dom'] },
      },
    }),
    new HtmlWebpackPlugin({ template: './public/index.html' }),
  ],
  devServer: { port: 3002, historyApiFallback: true },
  output: { publicPath: 'http://localhost:3002/', clean: true },
};
