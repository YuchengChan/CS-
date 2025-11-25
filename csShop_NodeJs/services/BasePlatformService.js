// 平台服务基类，定义统一的接口标准
class BasePlatformService {
  constructor() {
    if (this.constructor === BasePlatformService) {
      throw new Error('抽象类不能直接实例化');
    }
  }

  /**
   * 搜索商品信息
   * @param {Object} task - 任务对象
   * @returns {Promise<Object>} 包含商品信息、价格、磨损度的对象
   */
  async searchItem(task) {
    throw new Error('必须实现searchItem方法');
  }

  /**
   * 获取商品链接
   * @param {number} goodsId - 商品ID
   * @param {Object} task - 任务对象（可选）
   * @returns {string} 商品链接
   */
  getLink(goodsId, task = null) {
    throw new Error('必须实现getLink方法');
  }

  /**
   * 获取平台名称
   * @returns {string} 平台名称
   */
  getPlatformName() {
    throw new Error('必须实现getPlatformName方法');
  }
}

module.exports = BasePlatformService;