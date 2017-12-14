var url = require('url')
var path = require('path')
var proxy = require('proxy-middleware')
var rollup = require('rollup')
var connect = require('connect')
var serveStatic = require('serve-static')

var config = require('./rollup.config.dev')

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
rollup.watch(config)
