const axios = require('axios');

// 企业微信机器人的webhook URL
const webhookUrl = 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=8477948a-502e-4be9-aba4-ac3bab9d9523';

/**
 * 向企业微信机器人推送消息
 * @param {Object} productData - 商品数据对象
 * @returns {Promise<Object>} - 返回推送结果
 */
async function sendToWechatBot(productData) {
  try {
    // 构建消息内容
    const message = {
      msgtype: 'markdown',
      markdown: {
        content: `## 🔔 找到符合条件的商品\n` +
                 `**商品名称**: ${productData.name || '未知商品'}\n` +
                 `**商品ID**: ${productData.id || '未知ID'}\n` +
                 `**当前价格**: <font color="info">¥${productData.price || 0}</font>\n` +
                 `**目标价格**: <font color="comment">¥${productData.buyPrice || 0}</font>\n` +
                 `**磨损值**: ${productData.wear || '未知'}\n` +
                 `**搜索时间**: ${new Date().toLocaleString('zh-CN')}\n` +
                 `**购买链接**: [点击购买](${productData.link || '#'})\n` +
                 `\n> 此消息由商品监控系统自动推送`
      }
    };

    console.log('准备发送消息到企业微信机器人:', JSON.stringify(message, null, 2));

    // 发送请求到企业微信机器人
    const response = await axios.post(webhookUrl, message, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('消息推送成功，响应:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('向企业微信机器人推送消息失败:', error.message);
    if (error.response) {
      console.error('响应错误状态码:', error.response.status);
      console.error('响应错误数据:', error.response.data);
    }
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  sendToWechatBot
};