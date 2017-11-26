import cjs from 'rollup-plugin-commonjs'
import serve from 'rollup-plugin-serve'
import replace from 'rollup-plugin-replace'
import analyze from 'rollup-analyzer-plugin'
import resolve from 'rollup-plugin-node-resolve'
import livereload from 'rollup-plugin-livereload'

export default {
  input: 'src/index.js',
  output: {
    name: 'apicase',
    file: 'dist/index.js',
    format: 'iife'
  },
  plugins: [
    resolve(),
    cjs(),
    replace({
      'process.env.NODE_ENV': JSON.stringify('development')
    }),
    serve({
      contentBase: ['dist', 'views'],
      host: 'localhost',
      port: 8080
    }),
    livereload({
      watch: [
        'dist'
      ]
    }),
    analyze({ limit: 10 })
  ]
}
