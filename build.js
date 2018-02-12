var fs = require('fs')
var babel = require('babel-core')
var utils = require('util')
var rimraf = require('rimraf')

var rmdir = utils.promisify(rimraf)
var mkdir = utils.promisify(fs.mkdir)
var readdir = utils.promisify(fs.readdir)

var cjsConfig = {
  plugins: [
    ['nanoutils', { cjs: true }],
    [
      'transform-es2015-modules-simple-commonjs',
      {
        noInterop: true
      }
    ]
  ]
}

var esConfig = {
  plugins: [['nanoutils', { cjs: false }]]
}

Promise.resolve()
  .then(() => rmdir('./es').catch(() => {}))
  .then(() => rmdir('./cjs').catch(() => {}))
  .then(() => mkdir('./es'))
  .then(() => mkdir('./cjs'))
  .then(() => readdir('./lib'))
  .then(files => {
    files = files.filter(function(file) {
      return file.slice(-3) === '.js'
    })

    files.forEach(function(filename) {
      // Temporarily removed index.js from cjs
      if (filename !== 'index.js') {
        babel.transformFile('./lib/' + filename, cjsConfig, function(err, res) {
          if (err) throw err
          fs.writeFile('./cjs/' + filename, res.code, function(err) {
            if (err) throw err
          })
        })
      }
      babel.transformFile('./lib/' + filename, esConfig, function(err, res) {
        if (err) throw err
        fs.writeFile('./es/' + filename, res.code, function(err) {
          if (err) throw err
        })
      })
    })
  })
