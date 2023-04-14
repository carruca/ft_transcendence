import { fileURLToPath, URL } from "node:url";

import { defineConfig, loadEnv } from "vite";
import { createHtmlPlugin as html } from 'vite-plugin-html';
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
  return {
    base: './',
    server: {
      port: Number(process.env.VITE_PORT) || 3030,
    },
    plugins: [
      vue(),
      html({
        minify: process.env.NODE_ENV === 'production',
        inject: {
          data: { ...process.env },
        },
      }),
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  }
});
