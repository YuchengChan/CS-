// 价格控制器，处理价格对比相关的业务逻辑
const priceModel = require('../models/price.js');
const axios = require('axios');

const C5_API_KEY = 'babd002c6be6486d87d601d207a0cc8f';
const C5_API_URL = 'https://openapi.c5game.com/merchant/market/v2/item/stat/hash/name';

const priceController = {
  // 配置日志记录
  logApiResponse(endpoint, data) {
    console.log(`[${new Date().toISOString()}] ${endpoint} API Response:`, JSON.stringify(data).substring(0, 500) + (JSON.stringify(data).length > 500 ? '...' : ''));
  },

  logApiError(endpoint, error) {
    console.error(`[${new Date().toISOString()}] ${endpoint} API Error:`, 
      error.response ? 
      `Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data).substring(0, 500)}` : 
      error.message);
  },

  // 获取所有价格对比数据并更新价格
  async getPriceList(req, res) {
    try {
      // 1. 从数据库获取所有enName字段
      const marketHashNames = await priceModel.getAllEnNames();
      
      // 如果没有数据，直接返回空列表
      if (marketHashNames.length === 0) {
        const results = await priceModel.getAllPrices();
        return res.send({
          code: 200,
          message: '查询成功',
          success: true,
          data: results
        });
      }
      
      // 2. 构建请求参数并调用价格对比接口
      const requestData = {
        appId: 730,
        marketHashNames: marketHashNames
      };
      
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
      
      this.logApiResponse('C5批量价格', response.data);
      
      // 3. 处理API响应数据
      if (response.data.success && response.data.data) {
        console.log('API调用成功，开始更新数据库价格...');
        
        // 串行执行更新操作
        let updateCount = 0;
        const itemsToUpdate = Object.keys(response.data.data);
        
        for (const marketHashName of itemsToUpdate) {
          const itemData = response.data.data[marketHashName];
          const sellPrice = itemData.sellPrice;
          
          try {
            const updateResults = await priceModel.updatePrice(marketHashName, sellPrice);
            if (updateResults.affectedRows > 0) {
              updateCount++;
              console.log(`更新商品 ${marketHashName} 价格成功: ${sellPrice}`);
            }
          } catch (err) {
            console.error(`更新商品 ${marketHashName} 价格失败:`, err);
          }
        }
        
        console.log(`成功更新了 ${updateCount} 条价格记录`);
        
        // 4. 查询更新后的所有价格数据并返回
        const results = await priceModel.getAllPrices();
        return res.send({
          code: 200,
          message: `查询成功并更新价格 (${updateCount} 条更新)`,
          success: true,
          data: results
        });
      } else {
        // API返回失败，直接查询现有数据返回
        const results = await priceModel.getAllPrices();
        return res.send({
          code: 200,
          message: 'API调用失败，返回现有数据',
          success: true,
          data: results
        });
      }
    } catch (axiosError) {
      this.logApiError('C5批量价格', axiosError);
      // 接口调用失败，直接查询现有数据返回
      try {
        const results = await priceModel.getAllPrices();
        return res.send({
          code: 200,
          message: '接口调用失败，返回现有数据',
          success: true,
          data: results
        });
      } catch (err) {
        console.error('查询价格数据失败:', err);
        return res.send({
          code: 500,
          message: '查询价格数据失败',
          success: false,
          data: null
        });
      }
    }
  },

  // 添加价格对比记录
  async addPriceRecord(req, res) {
    try {
      const record = req.body;
      const result = await priceModel.addPriceRecord(record);
      return res.send({
        code: 200,
        message: '添加价格对比记录成功',
        id: result.id
      });
    } catch (err) {
      console.error('添加价格对比记录失败:', err);
      return res.send({
        code: 500,
        message: '添加价格对比记录失败',
        error: err.message
      });
    }
  },

  // 删除价格对比记录
  async deletePriceRecord(req, res) {
    try {
      const recordId = req.body.id;
      await priceModel.deletePriceRecord(recordId);
      return res.send({
        code: 200,
        message: '删除价格对比记录成功'
      });
    } catch (err) {
      console.error('删除价格对比记录失败:', err);
      return res.send({
        code: 500,
        message: '删除价格对比记录失败',
        error: err.message
      });
    }
  }
};

module.exports = priceController;