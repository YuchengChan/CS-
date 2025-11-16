import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
// 引入自动导入插件
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
// 引入 Element Plus 解析器
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import path from 'path'

export default defineConfig({
  plugins: [
    Vue(),
    // 配置自动导入
    AutoImport({
      resolvers: [ElementPlusResolver()], // 关键：添加 Element Plus 解析器
    }),
    Components({
      resolvers: [ElementPlusResolver()], // 关键：添加 Element Plus 解析器
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve("./src") // 相对路径别名配置，使用 @ 代替 src
    }
  }
})