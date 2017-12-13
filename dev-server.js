var url = require('url')
var path = require('path')
var proxy = require('proxy-middleware')
var rollup = require('rollup')
var connect = require('connect')
var serveStatic = require('serve-static')

var cjs = require('rollup-plugin-commonjs')
var replace = require('rollup-plugin-replace')
var analyze = require('rollup-analyzer-plugin')
var resolve = require('rollup-plugin-node-resolve')
var livereload = require('rollup-plugin-livereload')

var server = connect()

// Fake API
server.use('/api', proxy(url.parse('https://jsonplaceholder.typicode.com')))

// To include bundle to index.html
server.use('/dist', serveStatic(path.resolve(__dirname, './dist')))

// To open index.html
server.use(serveStatic(path.resolve(__dirname, './views')))

// Run server
server.listen(8080)

// Run rollup with dev config
rollup.watch({
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
})
