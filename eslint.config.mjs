// eslint.config.mjs
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import path from "path";
import { fileURLToPath } from "url";
import tseslint from "typescript-eslint";

// FlatCompat requires a baseDirectory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: __dirname,
});

export default tseslint.config(
    {
        ignores: ['.next/**', 'out/**', 'dist/**', 'build/**', 'coverage/**'],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    ...compat.extends("next/core-web-vitals"),
    {
        rules: {
            // Add custom rules here if needed
        }
    }
);
