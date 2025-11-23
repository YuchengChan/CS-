import { reactive } from 'vue'
import { ElMessage } from 'element-plus'
import request from './request'

// 创建响应式的store对象
export const store = reactive({
  // 存储从后端获取的商品数据 - 初始为空数组
  products: [],
  
  // 存储任务定时器ID - 全局状态，避免页面切换时丢失
  taskTimers: {},
  
  // 添加商品数据到store
  addProduct(productData) {
    // 检查当前数据量
    if (this.products.length >= 20) {
      // 如果已有20条数据，则移除最后一条
      this.products.pop();
    }
    
    // 直接在数组最前面插入新商品，不再检查重复
    // 这样每次找到商品都会在顶部显示最新的搜索记录
    this.products.unshift(productData);
  },
  
  // 清空商品数据
  clearProducts() {
    this.products = [];
  },
  
  // 设置任务定时器
  setTaskTimer(taskId, timerId) {
    this.taskTimers[taskId] = timerId;
  },
  
  // 清除任务定时器
  clearTaskTimer(taskId) {
    if (this.taskTimers[taskId]) {
      clearInterval(this.taskTimers[taskId]);
      delete this.taskTimers[taskId];
    }
  },
  
  // 停止所有任务定时器
  stopAllTaskTimers() {
    Object.keys(this.taskTimers).forEach(taskId => {
      clearInterval(this.taskTimers[taskId]);
    });
    this.taskTimers = {};
  },
  
  // 检查任务是否正在运行
  isTaskRunning(taskId) {
    return !!this.taskTimers[taskId]
  },
  
  // 价格对比相关方法
  // 存储价格对比数据
  prices: [],
  
  // 添加价格对比数据
  async addPrice(priceData) {
    try {
      const response = await request.post('/api/price/add', priceData)
      if (response.data.success) {
        ElMessage.success('添加成功')
        // 重新获取价格列表
        await this.fetchPrices()
        return response.data
      } else {
        ElMessage.error(response.data.message || '添加失败')
        throw new Error(response.data.message || '添加失败')
      }
    } catch (error) {
      // 避免将"添加成功"消息作为错误处理
      if (error.message && error.message.includes('添加成功')) {
        console.log('添加价格成功:', error)
        return { success: true }
      }
      console.error('添加价格失败:', error)
      ElMessage.error('添加失败，请稍后重试')
      throw error
    }
  },
  
  // 删除价格对比数据
  async deletePrice(priceId) {
    try {
      const response = await request.post('/api/price/delete', { id: priceId })
      if (response.data.success) {
        ElMessage.success('删除成功')
        // 重新获取价格列表
        await this.fetchPrices()
        return response.data
      } else {
        ElMessage.error(response.data.message || '删除失败')
        throw new Error(response.data.message || '删除失败')
      }
    } catch (error) {
      console.error('删除价格失败:', error)
      ElMessage.error('删除失败，请稍后重试')
      throw error
    }
  },
  
  // 获取价格对比列表
  async fetchPrices() {
    try {
      const response = await request.post('/api/price/list')
      if (response.data.success) {
        // 转换后端返回的驼峰命名为前端使用的下划线命名
        const transformedData = response.data.data.map(item => ({
          id: item.id,
          name: item.name,
          en_name: item.enName,
          target_price: item.targetPrice,
          buy_price: item.buyPrice,
          buy_link: item.buyLink
        }))
        this.prices = transformedData
        return transformedData
      } else {
        ElMessage.error(response.data.message || '获取价格列表失败')
        return []
      }
    } catch (error) {
      console.error('获取价格列表失败:', error)
      ElMessage.error('获取价格列表失败，请稍后重试')
      return []
    }
  }
})