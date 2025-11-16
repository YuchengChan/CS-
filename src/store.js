import { reactive } from 'vue'

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
    return !!this.taskTimers[taskId];
  }
})