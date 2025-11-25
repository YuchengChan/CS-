// 任务控制器，处理任务相关的业务逻辑
const taskModel = require('../models/task.js');
const { sendToWechatBot } = require('../wechatBot.js');
const PlatformServiceFactory = require('../services/PlatformServiceFactory.js');

const taskController = {
  // 获取任务列表
  async getTaskList(req, res) {
    try {
      const results = await taskModel.getAllTasks();
      console.log('查询任务列表成功！任务列表：', results);
      res.send(results);
    } catch (err) {
      console.error('获取任务列表失败：', err.message);
      res.status(500).send({ message: '获取任务列表失败', error: err.message });
    }
  },

  // 添加任务
  async addTask(req, res) {
    try {
      const task = req.body;
      const result = await taskModel.addTask(task);
      console.log('添加任务成功！任务ID：', result.id);
      res.send({
        code: 200,
        message: '添加任务成功',
        id: result.id
      });
    } catch (err) {
      console.error('添加任务失败：', err.message);
      res.send({
        code: 500,
        message: '添加任务失败',
        error: err.message
      });
    }
  },

  // 删除任务
  async deleteTask(req, res) {
    try {
      const taskId = req.body.id;
      await taskModel.deleteTask(taskId);
      console.log('删除任务成功！任务ID：', taskId);
      res.send({
        code: 200,
        message: '删除任务成功'
      });
    } catch (err) {
      console.error('删除任务失败：', err.message);
      res.status(500).send({ message: '删除任务失败', error: err.message });
    }
  },

  // 启动搜索任务
  async startSearchTask(req, res) {
    try {
      const { id } = req.body;
      const task = await taskModel.getTaskById(id);
      const goodsId = task.id;
      
      // 使用工厂模式创建平台服务实例
      const platformService = PlatformServiceFactory.create(task.platform);
      const platformName = platformService.getPlatformName();
      
      console.log(`任务ID: ${id}, 平台: ${platformName} (数据库值: ${task.platform})`);
      
      // 使用平台服务搜索商品
      const searchResult = await platformService.searchItem(task);
      const { item, price: apiPrice, wear: apiWear } = searchResult;
      
      // 比较条件
      const dbPrice = parseFloat(task.price) || 0;
      const dbWear = parseFloat(task.wear) || 1;
      
      if (apiPrice <= dbPrice || apiWear <= dbWear) {
        // 满足条件，推送消息
        const productData = {
          id: goodsId,
          name: task.name,
          price: apiPrice,
          buyPrice: task.price,
          wear: apiWear,
          link: platformService.getLink(goodsId, task),
          linkStatus: platformService.getLinkStatus(task),
          platform: platformName,
          platformId: task.platform
        };
        
        // 异步推送消息
        sendToWechatBot(productData).catch(err => {
          console.error('推送消息失败，不影响业务逻辑:', err);
        });
        
        return res.send({
          code: 200,
          message: '找到满足条件的商品',
          data: {
            task: task,
            item: item
          }
        });
      } else {
        return res.send({
          code: 201,
          message: '未找到满足条件的商品',
          data: {
            apiPrice,
            apiWear,
            dbPrice,
            dbWear
          }
        });
      }
    } catch (error) {
      // 处理特定的错误类型
      if (error.message.includes('未找到对应的商品数据')) {
        return res.send({
          code: 404,
          message: error.message
        });
      }
      
      console.error('启动搜索任务失败：', error.message);
      res.send({
        code: 500,
        message: '启动搜索任务失败：' + error.message
      });
    }
  }
};

module.exports = taskController;