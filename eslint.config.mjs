import globals from "globals";
import pluginJs from "@eslint/js";
import jsdoc from "eslint-plugin-jsdoc";

export default [
  { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
  { languageOptions: { globals: globals.node } },
  jsdoc.configs["flat/recommended"],

  {
    rules: {
      "no-undef": "error",
      "jsdoc/require-description": "warn",
    },
  },
];
