import { defineConfig } from 'vitest/config';
import path from "path"; // resolved via "npm install --save-dev @types/node"

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../shared")
    }
  },
  test: {
    'globals': true,
    'bail': 1,
    'environment': 'node',
    'setupFiles': './vitestSetup.ts',
  },
});
