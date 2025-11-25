// BUFF平台服务类
const axios = require('axios');
const BasePlatformService = require('./BasePlatformService.js');

const cookie = 'Device-Id=G0gvyUByJ7Kg7cRWznYG; remember_me=U1091788859|95ImIR8lCpgL3nqz7PhzMehNaOxwOzAC; session=1-BGXz-hYynwvX5EMSP1lRorMuDF_81EB714CRh3tb8-za2044591971; Locale-Supported=zh-Hans; game=csgo; csrf_token=IjgxYmNjYjMxODE0NTJiZTcwM2RlM2E1MmY3Zjk3ZDJkZWZmOWU2Zjci.aQwJLg.w_cjQvRavjsnN6RUWTzcftBfIhc';

class BuffPlatformService extends BasePlatformService {
  async searchItem(task) {
    const goodsId = task.id;
    const url = `https://buff.163.com/api/market/goods/sell_order?game=csgo&goods_id=${goodsId}&sort_by=default`;
    
    const response = await axios.get(url, {
      headers: {
        'Cookie': cookie
      }
    });
    
    const itemsArray = response.data.data && response.data.data.items && Array.isArray(response.data.data.items) ? response.data.data.items : [];
    
    if (itemsArray.length === 0) {
      throw new Error(`BUFF平台未找到对应的商品数据，商品ID: ${goodsId}`);
    }
    
    const item = itemsArray[0];
    const apiPrice = parseFloat(item.price) || 0;
    const paintwearValue = item.asset_info && item.asset_info.paintwear ? item.asset_info.paintwear : '1';
    const apiWear = parseFloat(paintwearValue) || 1;
    
    return {
      item,
      price: apiPrice,
      wear: apiWear
    };
  }

  getLink(goodsId, task = null) {
    return `https://buff.163.com/goods/${goodsId}?game=csgo`;
  }

  getLinkStatus(task) {
    return '正常';
  }

  getPlatformName() {
    return 'BUFF';
  }
}

module.exports = BuffPlatformService;