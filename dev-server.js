var connect = require('connect')
var livereload = require('livereload');
var static = require('serve-static');

var server = connect()

server.use('/dist', static(__dirname + '/dist'))

server.use(static(__dirname + '/views'))

server.listen(8080)

var lrserver = livereload.createServer();
lrserver.watch(__dirname + "/dist");
