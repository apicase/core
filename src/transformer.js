var log = require('./log')

function createTransformer (callback) {
  return function (options) {
    return callback(options)
  }
}

// Function that transforms call method
// TODO: solve problem "What to choose - all or call"
function transformService (instance, method, wrapper) {
  return instance.extend(function wrapInstance (i) {
    // i.base.pipeMethod = method

    i.call = function createCall () {
      var options = []
      for (var index in arguments) {
        if (method === 'call') {
          options.push(wrapper(arguments[index]))
        } else {
          options = options.concat(wrapper(arguments[index]))
        }
      }
      return instance.call.apply(i, options)
    }
  })
}

module.exports = {
  create: createTransformer,
  transform: transformService
}
