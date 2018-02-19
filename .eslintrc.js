module.exports = {
  'extends': 'standard',

  'env': {
    'node': true,
    'browser': true
  },

  'rules': {
    /* It's better to have indent for call expr with multi-lines */
    'indent': ['error', 2, { 'CallExpression': { 'arguments': 1 } }]
    /* Prettier doesn't support space before paren */
    'space-before-function-paren': 0
  }
}
