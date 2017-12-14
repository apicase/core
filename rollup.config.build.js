var cjs = require('rollup-plugin-commonjs')
var replace = require('rollup-plugin-replace')
var resolve = require('rollup-plugin-node-resolve')

module.exports = {
  input: 'index.js',
  output: {
    name: 'apicase',
    file: 'dist/index.js',
    format: 'iife'
  },
  plugins: [
    resolve(),
    cjs(),
    replace({
      'process.env.NODE_ENV': JSON.stringify('production')
    })
  ]
}
