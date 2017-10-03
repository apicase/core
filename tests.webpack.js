/* eslint-env node */
const testsContext = require.context('./test', true, /\.test\.js$/)
testsContext.keys().forEach(testsContext)
