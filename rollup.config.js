import fs from 'fs'
import path from 'path'
import cjs from 'rollup-plugin-commonjs'
import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'

const files = fs.readdirSync(path.resolve('lib'))

const methods = [
  'map',
  'pick',
  'omit',
  'clone',
  'merge',
  'equals',
  'mergeWith',
  'mapObjIndexed'
]

const apicase = files.map(i => `./${i.slice(0, -3)}`)
const nanoutils = methods.map(method => `nanoutils/lib/${method}`)

const external = [...apicase, ...nanoutils, 'nanoevents']

export default files.reduce(
  (res, name) =>
    res.concat({
      input: `./lib/${name}`,
      output: {
        file: `./cjs/${name}`,
        format: 'cjs'
      },
      plugins: [babel(), cjs(), resolve()],
      external
    }),
  []
)

// export default [
//   {
//     input: './lib/index.js',
//     output: {
//       file: './cjs/index.js',
//       format: 'cjs'
//     },
//     plugins: [babel(), cjs(), resolve()],
//     external
//   },
//   {
//     input: './lib/index.js',
//     output: {
//       file: './es/index.js',
//       format: 'es'
//     },
//     plugins: [],
//     external
//   }
// ]
