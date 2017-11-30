const cjs = require('rollup-plugin-commonjs')
const uglify = require('rollup-plugin-uglify-es')
const replace = require('rollup-plugin-replace')
const resolve = require('rollup-plugin-node-resolve')

module.exports = {
  input: 'src/index.js',
  output: {
    name: 'apicase',
    file: 'dist/index.js',
    format: 'umd'
  },
  plugins: [
    resolve({ jsnext: true }),
    cjs(),
    replace({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    uglify()
  ]
}
