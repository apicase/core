var log = require('./log')

function createTransformer (callback) {
  return function (options) {
    return callback(options)
  }
}

// Function that transforms call method
function transformService (instance, method, wrapper) {
  return instance.extend(function wrapInstance (i) {
    i.call = function createCall (options) {
      return instance[method](wrapper(options))
    }

    i.all = function blockedAll () {
      log.error(
        'instance.all() method is blocked in transformed services.',
        'Use instance.transformAll().call() instead.',
        new Error('Unexpected .all() call')
      )
    }
  })
}

module.exports = {
  create: createTransformer,
  transform: transformService
}

// const store = {
//   services: {
//     getPosts: pageId => ({
//       url: '/posts',
//       query: { pageId }
//     }),

//     getFullPost: id => ({
//       url: '/posts/:id',
//       params: { id }
//     })
//   },
//   actions: {
//     mapFullPosts: (services) =>
//       services.getFullPost.transformAll(i => i.posts.map(i => i.id)),

//     getFullPostsPage: (services, methods) => methods.chain([
//       services.getPosts,
//       services.getFullPostsPage
//     ])
//   }
// }

// export default store
