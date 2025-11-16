import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)

// 先使用路由插件
app.use(router)

// 再挂载应用
app.mount('#app')
