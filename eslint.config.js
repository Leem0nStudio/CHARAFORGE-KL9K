// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import nextjs from '@next/eslint-plugin-next';
import globals from 'globals';

export default tseslint.config([
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  nextjs.configs.recommended,
  {
    plugins: {
      react,
      'react-hooks': reactHooks,
      '@next/next': nextjs,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'warn',
      'no-prototype-builtins': 'warn',
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2020,
        ...globals.jest,
        Buffer: 'readonly',
        process: 'readonly',
        FormData: 'readonly',
        File: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        NodeJS: 'readonly',
        FirebaseFirestore: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        console: 'readonly',
        require: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
]);
