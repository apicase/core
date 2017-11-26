function createHooksCallChecker (type, meta) {
  return function hooksCallChecker () {
    console.log(type, meta.hooks[type])
  }
}

module.exports = {
  createHooksCallChecker
}
