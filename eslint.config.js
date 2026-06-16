const js = require("@eslint/js");
const globals = require("globals");
const prettier = require("eslint-config-prettier/flat");

module.exports = [
  {
    ignores: [
      "node_modules/**",
      "public/**",
      "coverage/**",
    ],
  },

  js.configs.recommended,
  prettier,

  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off",
      "eqeqeq": ["error", "always", { "null": "ignore" }],
      "curly": ["error", "all"],
    },
  },

  {
    files: ["src/__tests__/**"],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
];
