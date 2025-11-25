// 任务模型，封装任务相关的数据库操作
const db = require('./db.js');

const taskModel = {
  // 获取所有任务
  getAllTasks: () => {
    return new Promise((resolve, reject) => {
      db.query('SELECT * FROM task', (err, results) => {
        if (err) {
          console.error('查询任务列表失败：', err.message);
          reject(err);
          return;
        }
        resolve(results);
      });
    });
  },

  // 添加任务
  addTask: (task) => {
    return new Promise((resolve, reject) => {
      // 处理平台参数，将前端的字符串格式转换为数据库中的数字格式
      // BUFF -> 0, C5 -> 1，默认使用BUFF平台(0)
      if (task.platform) {
        task.platform = task.platform === 'C5' ? 1 : 0;
      } else {
        task.platform = 0; // 默认使用BUFF平台
      }
      
      // 处理购买链接字段，确保非必需字段的正确处理
      if (task.link === '' || task.link === undefined) {
        task.link = null;
      }
      
      db.query('INSERT INTO task SET ?', task, (err, results) => {
        if (err) {
          console.error('添加任务失败：', err.message);
          reject(err);
          return;
        }
        resolve({ id: results.insertId });
      });
    });
  },

  // 删除任务
  deleteTask: (taskId) => {
    return new Promise((resolve, reject) => {
      db.query('DELETE FROM task WHERE id = ?', taskId, (err, results) => {
        if (err) {
          console.error('删除任务失败：', err.message);
          reject(err);
          return;
        }
        resolve(results);
      });
    });
  },

  // 根据ID获取任务
  getTaskById: (taskId) => {
    return new Promise((resolve, reject) => {
      db.query('SELECT * FROM task WHERE id = ?', taskId, (err, results) => {
        if (err) {
          console.error('查询任务失败：', err.message);
          reject(err);
          return;
        }
        if (results.length === 0) {
          reject(new Error('任务不存在'));
          return;
        }
        resolve(results[0]);
      });
    });
  }
};

module.exports = taskModel;