/* eslint-env node */
require('extract-text-webpack-plugin')
const webpack = require('webpack')
const UglifyESPlugin = require('uglify-es-webpack-plugin')
const webpackSettings = require('./webpack.config')
const CompressionPlugin = require("compression-webpack-plugin")
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const optimizingPlugins = [
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify('production')
  }),
  new webpack.optimize.OccurrenceOrderPlugin,
  new UglifyESPlugin({
    sourceMap: false,
    compress: {
      warnings: false
    },
    output: {
      beautify: false,
      comments: false
    }
  }),
  new CompressionPlugin({
    asset: "[path].gz[query]",
    algorithm: "gzip",
    test: /\.(js|html)$/,
    threshold: 10240,
    minRatio: 0.8
  })
  // new BundleAnalyzerPlugin
]

webpackSettings.devtool = false
webpackSettings.plugins = optimizingPlugins;

module.exports = webpackSettings;
