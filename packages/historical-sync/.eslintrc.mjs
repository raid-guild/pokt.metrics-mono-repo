import rootConfig from '../../.eslintrc.cjs' assert { type: 'commonjs' };

/** @type {import("eslint").Linter.Config} */
export default {
  ...rootConfig,
  parserOptions: {
    ...rootConfig.parserOptions,
    project: './tsconfig.json',
  },
};
