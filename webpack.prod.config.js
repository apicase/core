/* eslint-env node */
require('extract-text-webpack-plugin')
const webpack = require('webpack')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const webpackSettings = require('./webpack.config')
const CompressionPlugin = require("compression-webpack-plugin")

const optimizingPlugins = [
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify('production')
  }),
  new webpack.optimize.OccurrenceOrderPlugin,
  new UglifyJSPlugin({
    sourceMap: false,
    uglifyOptions: {
      compress: {
        warnings: false
      },
      output: {
        beautify: false,
        comments: false
      }
    }
  }),
  new CompressionPlugin({
    asset: "[path].gz[query]",
    algorithm: "gzip",
    test: /\.(js|html)$/,
    minRatio: 0.8
  })
]

webpackSettings.devtool = false
webpackSettings.plugins = optimizingPlugins;

module.exports = webpackSettings;
