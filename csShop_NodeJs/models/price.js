// 价格模型，封装价格对比相关的数据库操作
const db = require('./db.js');

const priceModel = {
  // 获取所有价格对比数据
  getAllPrices: () => {
    return new Promise((resolve, reject) => {
      db.query('SELECT * FROM price ORDER BY targetPrice ASC', (err, results) => {
        if (err) {
          console.error('查询价格数据失败:', err);
          reject(err);
          return;
        }
        resolve(results);
      });
    });
  },

  // 获取所有enName字段
  getAllEnNames: () => {
    return new Promise((resolve, reject) => {
      db.query('SELECT enName FROM price', (err, results) => {
        if (err) {
          console.error('查询enName失败:', err);
          reject(err);
          return;
        }
        const enNames = results.map(row => row.enName);
        resolve(enNames);
      });
    });
  },

  // 更新商品价格
  updatePrice: (enName, price) => {
    return new Promise((resolve, reject) => {
      const updateSql = 'UPDATE price SET buyPrice = ? WHERE enName = ?';
      db.query(updateSql, [price, enName], (err, results) => {
        if (err) {
          console.error(`更新商品 ${enName} 价格失败:`, err);
          reject(err);
          return;
        }
        resolve(results);
      });
    });
  },

  // 添加价格对比记录
  addPriceRecord: (record) => {
    return new Promise((resolve, reject) => {
      db.query('INSERT INTO price SET ?', record, (err, results) => {
        if (err) {
          console.error('添加价格对比记录失败:', err);
          reject(err);
          return;
        }
        resolve({ id: results.insertId });
      });
    });
  },

  // 删除价格对比记录
  deletePriceRecord: (recordId) => {
    return new Promise((resolve, reject) => {
      db.query('DELETE FROM price WHERE id = ?', recordId, (err, results) => {
        if (err) {
          console.error('删除价格对比记录失败:', err);
          reject(err);
          return;
        }
        resolve(results);
      });
    });
  }
};

module.exports = priceModel;