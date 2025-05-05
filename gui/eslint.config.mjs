import { defineConfig } from "eslint/config";
import react from "eslint-plugin-react";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([{
  extends: compat.extends(
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/jsx-runtime",
  ),

  plugins: {
    react,
    "@typescript-eslint": typescriptEslint,
  },

  languageOptions: {
    globals: {
      ...globals.browser,
    },

    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module",
  },

  settings: {
    react: {
      version: "detect",
    },
  },

  rules: {
    indent: ["error", 2],
    "linebreak-style": ["error", "unix"],
    quotes: ["error", "double"],
    semi: ["error", "always"],
    "no-duplicate-imports": "error",
    "arrow-body-style": ["warn", "as-needed"],
    camelcase: "warn",
    curly: "error",
    eqeqeq: "error",
    "func-style": "warn",
    "no-else-return": "warn",
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-lonely-if": "warn",
    "no-mixed-operators": "warn",
    "no-multi-assign": "warn",
    "no-return-assign": "warn",
    "no-return-await": "warn",
    "no-sequences": "warn",
    "eol-last": "error",
    "comma-dangle": ["error", "always-multiline"],
  },
}]);
