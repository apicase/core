var url = require('url')
var proxy = require('proxy-middleware')
var serveStatic = require('serve-static')
var connect = require('connect')
var livereload = require('livereload')
var rollup = require('rollup')

var config = require('./rollup.config.dev.js')

var server = connect()

server.use('/api', proxy(url.parse('https://jsonplaceholder.typicode.com')))

server.use('/dist', serveStatic(__dirname + '/dist'))

server.use(serveStatic(__dirname + '/views'))

server.listen(8080)

var lrserver = livereload.createServer({
  port: 3000
})
lrserver.watch(__dirname + '/dist')

var watcher = rollup.watch(config)
