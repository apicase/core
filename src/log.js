function warn () {
  var text = ''
  for (var index in arguments) {
    text += ' ' + arguments[index]
  }
  console.error('[Apicase]' + text)
}

function error () {
  var args = []
  for (var index in arguments) {
    args.push(arguments[index])
  }
  warn.apply(null, args.slice(0, -1))
  throw args[args.length - 1]
}

module.exports = {
  warn,
  error
}
