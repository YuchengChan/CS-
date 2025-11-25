// C5平台服务类
const axios = require('axios');
const BasePlatformService = require('./BasePlatformService.js');

const C5_APP_KEY = 'babd002c6be6486d87d601d207a0cc8f';

class C5PlatformService extends BasePlatformService {
  async searchItem(task) {
    const url = 'https://openapi.c5game.com//merchant/market/v2/products/condition/hash/name';
    const params = {
      'app-key': C5_APP_KEY
    };
    
    const requestBody = {
      pageNum: 1,
      pageSize: 1,
      appId: 730,
      marketHashName: task.name,
      maxPrice: task.price * 100,
      delivery: 0
    };
    
    const response = await axios.post(url, requestBody, {
      params: params,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // 处理C5响应
    if (!response.data.success) {
      throw new Error(`C5 API返回失败: ${response.data.errorMsg || '未知错误'}`);
    }
    
    if (!response.data.data || !response.data.data.list || response.data.data.list.length === 0) {
      throw new Error(`C5平台未找到对应的商品数据，商品名称: ${task.name}`);
    }
    
    const item = response.data.data.list[0];
    const apiPrice = parseFloat(item.price) || 0;
    let apiWear = 1;
    if (item.assetInfo && item.assetInfo.wear !== undefined) {
      apiWear = parseFloat(item.assetInfo.wear) || 1;
    }
    
    return {
      item,
      price: apiPrice,
      wear: apiWear
    };
  }

  getLink(goodsId, task = null) {
    // 如果任务中有链接，则使用任务中的链接
    if (task && task.link) {
      return task.link;
    }
    // 否则使用默认链接
    return `https://www.c5game.com/csgo/item/${goodsId}.html`;
  }

  getLinkStatus(task) {
    return task && task.link ? '正常' : '数据库中link字段为空，使用默认链接';
  }

  getPlatformName() {
    return 'C5';
  }
}

module.exports = C5PlatformService;