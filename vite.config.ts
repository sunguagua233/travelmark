import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // GitHub Pages 部署路径配置
  // 如果仓库名为 'routeplanner'，则路径为 '/routeplanner/'
  // 如果使用自定义域名或根目录部署，则改为 '/'
  base: process.env.NODE_ENV === 'production' ? '/routeplanner/' : '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
