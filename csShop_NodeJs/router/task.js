const express = require('express')
const router = express.Router()
const taskController = require('../controllers/taskController.js')

// 挂载任务相关路由，调用对应的控制器方法
router.get('/task/list', taskController.getTaskList)
router.post('/task/add', taskController.addTask)
router.delete('/task/delete', taskController.deleteTask)
router.post('/task/start-search', taskController.startSearchTask)

module.exports = router