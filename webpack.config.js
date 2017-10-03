/* eslint-env node */
require('extract-text-webpack-plugin')
const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const resolve = dir => path.join(__dirname, '..', dir)

module.exports = {
  devtool: 'sourcemap',
  entry: {
    index: './src/index.js'
  },
  output: {
    path: path.resolve('./dist'),
    filename: 'bundle.js',
    library: 'Apicase',
    libraryTarget: 'umd'
  },
  resolve: {
    modules: ['node_modules', 'src'],
    extensions: ['.js'],
    alias: {
      '@': resolve('src')
    }
  },
  module: {
    loaders: [
      { test: /\.js?$/, loader: 'babel-loader', exclude: /node_modules/ },
      { test: /\.html$/, loader: 'raw' }
    ]
  },
  devServer: {
    proxy: {
      '/api': {
        target: 'http://jsonplaceholder.typicode.com/',
        changeOrigin: true,
        pathRewrite: {
          '^/api': ''
        }
      }
    }
  },
  plugins: [
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development')
    }),
    new BundleAnalyzerPlugin({ openAnalyzer: false }),
    new HtmlWebpackPlugin({
      template: './views/index.ejs',
      inject: false
    })
  ]
}
