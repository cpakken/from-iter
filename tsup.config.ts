import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],

  // minify: true,
  minify: 'terser',
  terserOptions: {
    mangle: {
      properties: {
        // regex: /^_/, //leave off, better bundle size (surprisingly)
      },
    },
  },

  clean: true,
  treeshake: true,
  // sourcemap: true,
  // dts: true,
})
