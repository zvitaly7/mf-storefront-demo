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
      name: 'shell',
      remotes: {
        catalog: 'catalog@http://localhost:3001/remoteEntry.js',
        checkout: 'checkout@http://localhost:3002/remoteEntry.js',
      },
      shared: {
        // CRITICAL: declaring React 16 while installing React 18 (never updated after migration)
        react: { singleton: true, requiredVersion: deps.react, eager: true },
        'react-dom': { singleton: true, requiredVersion: deps['react-dom'], eager: true },
        // CRITICAL: React Router v5 API (useHistory) vs v6 installed (useNavigate)
        'react-router-dom': { singleton: true, requiredVersion: deps['react-router-dom'], eager: true },
        // CRITICAL: Zustand v3 API (create with single function) vs v4 (split create)
        zustand: { singleton: true, requiredVersion: deps.zustand, eager: true },
      },
    }),
    new HtmlWebpackPlugin({ template: './public/index.html' }),
  ],
  devServer: { port: 3000, historyApiFallback: true },
  output: { publicPath: 'http://localhost:3000/', clean: true },
};
