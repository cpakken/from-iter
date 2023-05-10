import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],

  // minify: true,
  minify: 'terser',
  terserOptions: {
    mangle: {
      properties: {
        regex: /^_/,
      },
    },
  },

  clean: true,
  treeshake: true,
  dts: true,
  // sourcemap: true,
})
