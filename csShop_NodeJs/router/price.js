// 导入必要的模块
const express = require('express');
const router = express.Router();
const db = require('../db');
const axios = require('axios');

// C5游戏API配置
const C5_API_KEY = 'babd002c6be6486d87d601d207a0cc8f';
const C5_API_URL = 'https://openapi.c5game.com/merchant/market/v2/item/stat/hash/name';

// 配置日志记录
const logApiResponse = (endpoint, data) => {
  console.log(`[${new Date().toISOString()}] ${endpoint} API Response:`, JSON.stringify(data).substring(0, 500) + (JSON.stringify(data).length > 500 ? '...' : ''));
};

const logApiError = (endpoint, error) => {
  console.error(`[${new Date().toISOString()}] ${endpoint} API Error:`, 
    error.response ? 
    `Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data).substring(0, 500)}` : 
    error.message);
};

// 获取所有价格对比数据并更新价格
router.post('/api/price/list', async (req, res) => {
  try {
    // 1. 从数据库获取所有enName字段
    const getEnNamesSql = 'SELECT enName FROM price';
    db.query(getEnNamesSql, async (err, enNameResults) => {
      if (err) {
        console.error('查询enName失败:', err);
        return res.send({
          code: 500,
          message: '查询enName失败',
          success: false,
          data: null
        });
      }
      
      // 提取所有enName字段
      const marketHashNames = enNameResults.map(row => row.enName);
      
      // 如果没有数据，直接返回空列表
      if (marketHashNames.length === 0) {
        const getAllSql = 'SELECT * FROM price ORDER BY targetPrice ASC';
        db.query(getAllSql, (err, results) => {
          if (err) {
            console.error('查询价格数据失败:', err);
            return res.send({
              code: 500,
              message: '查询价格数据失败',
              success: false,
              data: null
            });
          }
          
          return res.send({
            code: 200,
            message: '查询成功',
            success: true,
            data: results
          });
        });
        return;
      }
      
      try {
        // 2. 构建请求参数并调用价格对比接口
        const requestData = {
          appId: 730,
          marketHashNames: marketHashNames
        };
        
        console.log('准备调用C5 API，请求参数:', JSON.stringify({url: C5_API_URL, params: {'app-key': C5_API_KEY}, data: requestData}).substring(0, 500));
        
        const response = await axios.post(C5_API_URL, requestData, {
          params: {
            'app-key': C5_API_KEY
          },
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 10000 // 设置10秒超时
        });
        
        logApiResponse('C5批量价格', response.data);
        
        // 3. 处理API响应数据
        if (response.data.success && response.data.data) {
          console.log('API调用成功，开始更新数据库价格...');
          
          // 遍历API返回的数据，更新数据库
          let updateCount = 0;
          let hasError = false;
          
          const itemsToUpdate = Object.keys(response.data.data);
          
          // 串行执行更新操作
          const updateNextItem = (index) => {
            if (index >= itemsToUpdate.length) {
              // 所有更新完成，查询数据
              console.log(`成功更新了 ${updateCount} 条价格记录`);
              
              // 4. 查询更新后的所有价格数据并返回（按目标价格升序）
              const getAllSql = 'SELECT * FROM price ORDER BY targetPrice ASC';
              db.query(getAllSql, (err, results) => {
                if (err) {
                  console.error('查询更新后的数据失败:', err);
                  return res.send({
                    code: 500,
                    message: '查询更新后的数据失败',
                    success: false,
                    data: null
                  });
                }
                
                return res.send({
                  code: 200,
                  message: `查询成功并更新价格 (${updateCount} 条更新)`,
                  success: true,
                  data: results
                });
              });
              return;
            }
            
            const marketHashName = itemsToUpdate[index];
            const itemData = response.data.data[marketHashName];
            const sellPrice = itemData.sellPrice;
            
            // 更新数据库
            const updateSql = 'UPDATE price SET buyPrice = ? WHERE enName = ?';
            db.query(updateSql, [sellPrice, marketHashName], (err, updateResults) => {
              if (err) {
                console.error(`更新商品 ${marketHashName} 价格失败:`, err);
                hasError = true;
              } else {
                if (updateResults.affectedRows > 0) {
                  updateCount++;
                  console.log(`更新商品 ${marketHashName} 价格成功: ${sellPrice}`);
                }
              }
              
              // 更新下一个商品
              updateNextItem(index + 1);
            });
          };
          
          // 开始更新
          updateNextItem(0);
        } else {
          // API返回失败，直接查询现有数据返回
          const getAllSql = 'SELECT * FROM price ORDER BY targetPrice ASC';
          db.query(getAllSql, (err, results) => {
            if (err) {
              console.error('查询价格数据失败:', err);
              return res.send({
                code: 500,
                message: '查询价格数据失败',
                success: false,
                data: null
              });
            }
            
            return res.send({
              code: 200,
              message: 'API调用失败，返回现有数据',
              success: true,
              data: results
            });
          });
        }
      } catch (axiosError) {
        logApiError('C5批量价格', axiosError);
        // 接口调用失败，直接查询现有数据返回
        const getAllSql = 'SELECT * FROM price ORDER BY targetPrice ASC';
        db.query(getAllSql, (err, results) => {
          if (err) {
            console.error('查询价格数据失败:', err);
            return res.send({
              code: 500,
              message: '查询价格数据失败',
              success: false,
              data: null
            });
          }
          
          return res.send({
            code: 200,
            message: '接口调用失败，返回现有数据',
            success: true,
            data: results
          });
        });
      }
    });
  } catch (error) {
    console.error('获取价格对比数据失败:', error);
    return res.send({
      code: 500,
      message: '获取价格对比数据失败',
      success: false,
      data: null
    });
  }
});

// 添加价格对比数据
router.post('/api/price/add', (req, res) => {
  const { name, en_name, target_price } = req.body;
  
  // 验证必要参数
  if (!name || !en_name || !target_price) {
    return res.send({
      code: 400,
      message: '请填写完整的商品信息',
      data: null
    });
  }
  
  // 先获取最新的购买价格
  getLatestBuyPrice(en_name).then(buyPrice => {
    // 插入数据到数据库
    const sql = 'INSERT INTO price (name, enName, targetPrice, buyPrice) VALUES (?, ?, ?, ?)';
    const values = [name, en_name, parseFloat(target_price), buyPrice || 0];
    
    db.query(sql, values, (err, results) => {
      if (err) {
        console.error('添加价格对比数据失败:', err);
        return res.send({
          code: 500,
          message: '添加价格对比数据失败',
          data: null
        });
      }
      
      res.send({
        code: 200,
        success: true,
        message: '添加成功',
        data: {
          id: results.insertId,
          name,
          enName: en_name,
          targetPrice: parseFloat(target_price),
          buyPrice: buyPrice || 0
        }
      });
    });
  }).catch(error => {
    console.error('获取购买价格失败:', error);
    // 即使获取价格失败也允许添加，使用默认值
    const sql = 'INSERT INTO price (name, enName, targerPrice, buyPrice) VALUES (?, ?, ?, 0)';
    const values = [name, en_name, parseFloat(target_price)];
    
    db.query(sql, values, (err, results) => {
      if (err) {
        return res.send({
          code: 500,
          message: '添加价格对比数据失败',
          data: null
        });
      }
      
      res.send({
        code: 200,
        success: true,
        message: '添加成功，但获取实时价格失败',
        data: {
          id: results.insertId,
          name,
          enName: en_name,
          targetPrice: parseFloat(target_price),
          buyPrice: 0
        }
      });
    });
  });
});

// 删除价格对比数据
router.post('/api/price/delete', (req, res) => {
  const { id } = req.body;
  
  if (!id) {
    return res.send({
      code: 400,
      message: '请提供要删除的记录ID',
      data: null
    });
  }
  
  const sql = 'DELETE FROM price WHERE id = ?';
  
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error('删除价格对比数据失败:', err);
      return res.send({
        code: 500,
        message: '删除价格对比数据失败',
        data: null
      });
    }
    
    if (results.affectedRows === 0) {
      return res.send({
        code: 404,
        message: '未找到要删除的记录',
        data: null
      });
    }
    
    res.send({
      code: 200,
      message: '删除成功',
      data: null
    });
  });
});

// 更新价格对比数据
router.post('/api/price/update', (req, res) => {
  const { id, name, en_name, target_price } = req.body;
  
  if (!id) {
    return res.send({
      code: 400,
      message: '请提供要更新的记录ID',
      data: null
    });
  }
  
  // 构建更新数据对象
  const updateData = {};
  if (name) updateData.name = name;
  if (en_name) updateData.enName = en_name;
  if (target_price !== undefined) updateData.targerPrice = parseFloat(target_price);
  
  // 如果更新了英文名称，重新获取购买价格
  if (en_name) {
    getLatestBuyPrice(en_name).then(buyPrice => {
      updateData.buyPrice = buyPrice || 0;
      updatePriceRecord(id, updateData, res);
    }).catch(error => {
      console.error('获取购买价格失败:', error);
      updatePriceRecord(id, updateData, res);
    });
  } else {
    updatePriceRecord(id, updateData, res);
  }
});

// 辅助函数：更新价格记录
function updatePriceRecord(id, updateData, res) {
  // 构建SQL语句
  const fields = Object.keys(updateData);
  const values = Object.values(updateData);
  const setClause = fields.map(field => `${field} = ?`).join(', ');
  
  const sql = `UPDATE price SET ${setClause} WHERE id = ?`;
  values.push(id);
  
  db.query(sql, values, (err, results) => {
    if (err) {
      console.error('更新价格对比数据失败:', err);
      return res.send({
        code: 500,
        message: '更新价格对比数据失败',
        data: null
      });
    }
    
    if (results.affectedRows === 0) {
      return res.send({
        code: 404,
        message: '未找到要更新的记录',
        data: null
      });
    }
    
    res.send({
      code: 200,
      message: '更新成功',
      data: { id, ...updateData }
    });
  });
}

// 辅助函数：获取最新购买价格（不分平台）
async function getLatestBuyPrice(enName) {
  try {
    // 直接使用C5平台API获取价格，不再分平台
    const price = await getC5Price(enName);
    return price || 0;
  } catch (error) {
    console.error('获取价格失败:', error);
    return 0;
  }
}

// 辅助函数：批量获取C5平台价格数据
async function batchGetC5Prices() {
  return new Promise((resolve, reject) => {
    // 从数据库获取所有enName字段
    const sql = 'SELECT enName FROM price';
    
    db.query(sql, (err, results) => {
      if (err) {
        console.error('查询price表数据失败:', err);
        return reject(err);
      }
      
      // 提取所有enName字段
      const marketHashNames = results.map(row => row.enName);
      
      if (marketHashNames.length === 0) {
        return resolve({});
      }
      
      // 构建请求参数
      const requestData = {
        appId: 730,
        marketHashNames: marketHashNames
      };
      
      // 发送请求到C5游戏API
      axios.post(C5_API_URL, requestData, {
        params: {
          'app-key': C5_API_KEY
        },
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      }).then(response => {
        console.log('C5 API响应:', response.data);
        resolve(response.data);
      }).catch(error => {
        console.error('C5 API请求失败:', error);
        reject(error);
      });
    });
  });
}

// 更新所有价格数据的接口
router.post('/api/price/update-all', (req, res) => {
  batchGetC5Prices().then(data => {
    // 处理API返回的数据并更新数据库
    if (data.success && data.data) {
      updatePricesInDatabase(data.data).then(updateCount => {
        res.send({
          code: 200,
          message: `批量更新价格成功，共更新 ${updateCount} 条记录`,
          data: data,
          updateCount: updateCount
        });
      }).catch(error => {
        console.error('更新数据库价格失败:', error);
        res.send({
          code: 500,
          message: '批量更新价格失败，数据库更新出错',
          error: error.message
        });
      });
    } else {
      res.send({
        code: 500,
        message: 'API返回数据格式错误',
        data: data
      });
    }
  }).catch(error => {
    res.send({
      code: 500,
      message: '批量更新价格失败',
      error: error.message
    });
  });
});

// 辅助函数：更新数据库中的价格数据
function updatePricesInDatabase(priceData) {
  return new Promise((resolve, reject) => {
    // 开始事务
    db.beginTransaction(err => {
      if (err) {
        return reject(err);
      }
      
      let updateCount = 0;
      const marketHashNames = Object.keys(priceData);
      
      if (marketHashNames.length === 0) {
        db.commit();
        return resolve(0);
      }
      
      // 遍历所有商品数据
      const updatePromises = marketHashNames.map(marketHashName => {
        return new Promise((resolveSingle, rejectSingle) => {
          const itemData = priceData[marketHashName];
          const sellPrice = itemData.sellPrice;
          
          // 更新数据库中的buyPrice字段
          const sql = 'UPDATE price SET buyPrice = ? WHERE enName = ?';
          db.query(sql, [sellPrice, marketHashName], (err, results) => {
            if (err) {
              return rejectSingle(err);
            }
            if (results.affectedRows > 0) {
              updateCount++;
              console.log(`更新商品 ${marketHashName} 价格成功，新价格: ${sellPrice}`);
            }
            resolveSingle();
          });
        });
      });
      
      // 等待所有更新完成
      Promise.all(updatePromises).then(() => {
        // 提交事务
        db.commit(err => {
          if (err) {
            return reject(err);
          }
          resolve(updateCount);
        });
      }).catch(error => {
        // 回滚事务
        db.rollback();
        reject(error);
      });
    });
  });
}

// 从C5平台获取价格（使用新的API）
async function getC5Price(enName) {
  try {
    // 使用C5游戏API获取单个商品价格
    const requestData = {
      appId: 730,
      marketHashNames: [enName]
    };
    
    console.log('准备调用C5 API获取单个商品价格，请求参数:', JSON.stringify({url: C5_API_URL, params: {'app-key': C5_API_KEY}, data: requestData}).substring(0, 500));
    
    const response = await axios.post(C5_API_URL, requestData, {
      params: {
        'app-key': C5_API_KEY
      },
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    logApiResponse('C5单个价格', response.data);
    
    // 从API响应中提取价格数据
    console.log(`获取单个商品 ${enName} 价格成功，响应数据:`, response.data);
    
    // 根据API返回的数据格式提取价格
    // 参照updatePricesInDatabase函数的实现，应该从response.data中提取sellPrice
    if (response.data && response.data.data && response.data.data[enName]) {
      const itemData = response.data.data[enName];
      if (itemData.sellPrice) {
        return parseFloat(itemData.sellPrice);
      }
    }
    
    // 如果没有找到价格数据，返回0
    return 0;
  } catch (error) {
    console.error('C5平台价格查询失败:', error);
    return 0;
  }
}

// 从BUFF平台获取价格
async function getBuffPrice(enName) {
  try {
    // 模拟BUFF平台API调用
    // 实际项目中应该调用真实的BUFF平台API
    const response = await axios.get('https://buff.163.com/api/market/goods/sell_order', {
      params: {
        game: 'csgo',
        page_num: 1,
        page_size: 1,
        keyword: enName
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (response.data.code === 'OK' && response.data.data.items && response.data.data.items.length > 0) {
      return parseFloat(response.data.data.items[0].price);
    }
    
    return 0;
  } catch (error) {
    console.error('BUFF平台价格查询失败:', error);
    return 0;
  }
}

// 导出路由
module.exports = router;