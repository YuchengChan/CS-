// 引入express
const express = require('express')
const cors = require('cors') // 导入 cors

// 创建 web 服务器
const app = express()

const db = require('./db.js')
// 配置 CORS：允许来自 http://localhost:5173 的请求
app.use(cors({
  origin: 'http://localhost:5173', // 明确指定允许的前端源
}))

// 解析 JSON 请求体
app.use(express.json())

// 导入任务路由模块
const taskRouter = require('./router/task.js')
// 导入价格对比路由模块
const priceRouter = require('./router/price.js')

// 挂载任务路由（添加/api前缀）
app.use('/api', taskRouter)
// 挂载价格对比路由
app.use('/', priceRouter)


// 监听端口，启动服务
app.listen(8000, () => {
  console.log('服务已启动')
})