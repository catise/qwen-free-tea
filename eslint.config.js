import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import importPlugin from 'eslint-plugin-import'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      import: importPlugin,
    },

    rules: {
      'import/newline-after-import': ['warn'], // import 语句后新增一行
      'import/no-empty-named-blocks': ['warn'], // 不能空导入
      'import/no-duplicates': ['warn', { 'prefer-inline': true }], // 不能重复从一个文件导入
      'import/no-useless-path-segments': [
        'error',
        {
          noUselessIndex: true,
        },
      ],
      'import/order': [
        // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/order.md
        'warn',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'index', 'sibling'],
            'object',
            'unknown',
          ],
          pathGroups: [
            {
              pattern: '@/**',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: 'src/**',
              group: 'internal',
              position: 'after',
            },
            // https://github.com/import-js/eslint-plugin-import/issues/1239#issuecomment-598064339
            {
              pattern: '**/*.+(css|sass|less|scss|pcss|styl)',
              patternOptions: { dot: true, nocomment: true },
              group: 'unknown',
              position: 'after',
            },
            {
              pattern: '{.,..}/**/*.+(css|sass|less|scss|pcss|styl)',
              patternOptions: { dot: true, nocomment: true },
              group: 'unknown',
              position: 'after',
            },
            {
              pattern: '**/*.+(svg|png|gif|jpg|jpeg|webp|bmp|ico)',
              patternOptions: { dot: true, nocomment: true },
              group: 'unknown',
              position: 'after',
            },
            {
              pattern: '{.,..}/**/*.+(svg|png|gif|jpg|jpeg|webp|bmp|ico)',
              patternOptions: { dot: true, nocomment: true },
              group: 'unknown',
              position: 'after',
            },
          ],
          pathGroupsExcludedImportTypes: [],
          distinctGroup: false,
          'newlines-between': 'always', // import 语句中间新增一行
          named: {
            // 导入名称按字母排序
            enabled: true,
            types: 'types-first',
          },
          alphabetize: {
            // 导入名称按字母排序
            order: 'asc',
          },
        },
      ],
    },
  },
])
