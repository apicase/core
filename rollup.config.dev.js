var cjs = require('rollup-plugin-commonjs')
var replace = require('rollup-plugin-replace')
var analyze = require('rollup-analyzer-plugin')
var resolve = require('rollup-plugin-node-resolve')
var livereload = require('rollup-plugin-livereload')

module.exports = {
  input: 'src/index.js',
  output: {
    name: 'apicase',
    file: 'dist/index.js',
    format: 'iife'
  },
  plugins: [
    resolve(),
    cjs(),
    replace({
      'process.env.NODE_ENV': JSON.stringify('development')
    }),
    livereload({
      watch: [
        'dist'
      ]
    }),
    analyze({ limit: 10 })
  ]
}
