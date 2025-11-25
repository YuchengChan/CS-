// 引入express
const express = require('express')
const cors = require('cors') // 导入 cors

// 创建 web 服务器
const app = express()

// 使用models目录下的数据库连接
const db = require('./models/db.js')

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

// 测试数据库连接
const testDbConnection = () => {
  return new Promise((resolve, reject) => {
    db.query('SELECT 1', (err, results) => {
      if (err) {
        console.error('数据库连接失败:', err)
        reject(err)
      } else {
        console.log('数据库连接成功')
        resolve()
      }
    })
  })
}

// 监听端口，启动服务
async function startServer() {
  try {
    // 启动前测试数据库连接
    await testDbConnection()
    
    // 启动服务器
    app.listen(8000, () => {
      console.log('服务已启动在端口 8000')
      console.log('MVC架构后端服务运行中...')
      console.log('API地址: http://localhost:8000/api')
    })
  } catch (error) {
    console.error('启动服务失败:', error)
    process.exit(1)
  }
}

// 启动服务器
startServer()