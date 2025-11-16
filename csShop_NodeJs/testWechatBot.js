const { sendToWechatBot } = require('./wechatBot');

/**
 * 测试企业微信机器人推送功能
 */
async function testWechatBot() {
  try {
    console.log('开始测试企业微信机器人推送功能...');
    
    // 创建测试商品数据
    const testProduct = {
      id: 'TEST001',
      name: '测试商品 - AWP | 巨龙传说',
      price: 12345.67,
      buyPrice: 15000,
      wear: 0.1,
      link: 'https://buff.163.com/goods/12345'
    };
    
    // 调用推送函数
    const result = await sendToWechatBot(testProduct);
    
    // 输出测试结果
    if (result.success) {
      console.log('✅ 测试成功！消息已成功推送到企业微信机器人');
      console.log('响应数据:', result.data);
    } else {
      console.error('❌ 测试失败:', result.error);
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

// 执行测试
testWechatBot();