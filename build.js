const fs = require('fs')
const babel = require('babel-core')
const utils = require('util')
const rimraf = require('rimraf')

const rmdir = utils.promisify(rimraf)
const mkdir = utils.promisify(fs.mkdir)
const readdir = utils.promisify(fs.readdir)

const config = {
  plugins: [['nanoutils']]
}

Promise.resolve()
  .then(() => rmdir('./es').catch(() => {}))
  .then(() => mkdir('./es'))
  .then(() => readdir('./lib'))
  .then(files => {
    files = files.filter(function(file) {
      return file.slice(-3) === '.js'
    })

    files.forEach(function(filename) {
      // Temporarily removed index.js from cjs
      babel.transformFile('./lib/' + filename, config, function(err, res) {
        if (err) throw err
        fs.writeFile('./es/' + filename, res.code, function(err) {
          if (err) throw err
        })
      })
    })
  })
