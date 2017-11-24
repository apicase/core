import cjs from 'rollup-plugin-commonjs'
import uglify from 'rollup-plugin-uglify-es'
import replace from 'rollup-plugin-replace'
import resolve from 'rollup-plugin-node-resolve'

export default {
  input: 'src/index.js',
  output: {
    name: 'apicase',
    file: 'dist/index.js',
    format: 'umd'
  },
  plugins: [
    resolve({ jsnext: true }),
    cjs(),
    replace({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    uglify()
  ]
}
