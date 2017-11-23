import cjs from 'rollup-plugin-commonjs'
import babel from 'rollup-plugin-babel'
import serve from 'rollup-plugin-serve'
import analyze from 'rollup-analyzer-plugin'
import resolve from 'rollup-plugin-node-resolve'
import livereload from 'rollup-plugin-livereload'

export default {
  input: 'src/index.js',
  output: {
    name: 'apicasecore',
    file: 'dist/index.js',
    format: 'umd'
  },
  plugins: [
    babel({
      exclude: 'node_modules/**'
    }),
    resolve({ jsnext: true }),
    cjs(),
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
