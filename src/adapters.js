function fetchAdapter (ctx) {
  return fetch(ctx.options.url)
    .then(function resolveFetch (res) {
      return res.json()
    })
    .then(function resolveAdapter (data) {
      ctx.done(data)
    })
    .catch(function rejectAdapter (reason) {
      ctx.fail(reason)
    })
}

module.exports = {
  fetch: fetchAdapter
}
