// 平台服务工厂类，用于创建不同平台的服务实例
const C5PlatformService = require('./C5PlatformService.js');
const BuffPlatformService = require('./BuffPlatformService.js');

class PlatformServiceFactory {
  /**
   * 根据平台类型创建对应的服务实例
   * @param {number|string} platformType - 平台类型（0或'BUFF'为BUFF平台，1或'C5'为C5平台）
   * @returns {BasePlatformService} 平台服务实例
   */
  static create(platformType) {
    if (platformType === 1 || platformType === 'C5') {
      return new C5PlatformService();
    } else if (platformType === 0 || platformType === 'BUFF' || !platformType) {
      return new BuffPlatformService();
    } else {
      throw new Error(`不支持的平台类型: ${platformType}`);
    }
  }

  /**
   * 获取平台名称
   * @param {number} platformType - 平台类型
   * @returns {string} 平台名称
   */
  static getPlatformName(platformType) {
    if (platformType === 1) {
      return 'C5';
    }
    return 'BUFF';
  }
}

module.exports = PlatformServiceFactory;