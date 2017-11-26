const log = require('./log')

// TODO: add debugging for hook calls
function isAllHooksCalled (type, meta) {}

function isAdapterInstalledCorrectly (name, adapters) {
  var adapter = adapters[name]
  if (
    !adapter ||
    typeof adapter !== 'object' ||
    !adapter.callback ||
    typeof adapter.callback !== 'function'
  ) {
    log.error(
      'Adapter ' + name + ' should be a function or object with callback property',
      '(' + typeof adapter + ' given)',
      new Error('Failed to install adapter')
    )
  }
}

module.exports = {
  isAllHooksCalled,
  isAdapterInstalledCorrectly
}
