import request from '../request';
import { ElMessage } from 'element-plus';
import { store } from '../store';

/**
 * 执行C5平台的搜索任务
 * @param {Object} row - 任务行数据
 * @returns {Promise<void>}
 */
export const executeC5Search = async (row) => {
  try {
    // 发送请求到后端，明确指定平台为C5
    const response = await request.post('/api/task/start-search', {
      id: row.id,
      platform: 'C5'
    });
    
    if (response.data.code === 200) {
      ElMessage({
        showClose: true,
        message: `任务 ${row.name} 搜索成功: ${response.data.message}`,
        type: 'success',
      })
      // 如果找到满足条件的商品，将数据存储到store中
      console.log('找到满足条件的C5平台商品:', response);
      
      // 处理后端返回的数据，包含task和item两个部分
      const { task: dbTask, item: apiItem } = response.data.data;
      
      // 构建C5平台商品数据对象，包含shop.vue表格需要的字段
      const productData = {
        id: `${dbTask.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // 使用任务ID+时间戳+随机字符串确保唯一标识
        name: dbTask.name,
        img: apiItem.img || '', // C5平台可能有不同的图片字段，这里做兼容处理
        wear: apiItem.wear || dbTask.wear, // C5平台可能有不同的磨损值字段，这里做兼容处理
        price: apiItem.price,
        buyPrice: dbTask.price, // 购买价格从任务设置中获取
        // C5平台的购买链接，使用数据库中的link字段值
        link: dbTask.link || '',
        searchTime: new Date(), // 添加搜索时间
        originalItemId: apiItem.id || dbTask.id, // 保留原始商品ID用于识别同一商品
        platform: 1 // 明确平台信息，1表示C5平台
      };
      
      // 存储到全局store中
      store.addProduct(productData);
    } else if (response.data.code === 201) {
      console.log(`C5任务 ${row.name} 未找到满足条件的商品，继续搜索...`);
    } else {
      ElMessage({
        showClose: true,
        message: response.data.message || 'C5平台搜索任务执行失败',
        type: 'warning',
      })
      console.log(`C5任务 ${row.name} 执行状态:`, response.data);
    }
  } catch (error) {
    console.error(`C5任务 ${row.name} 执行失败:`, error);
  }
};

/**
 * 启动C5平台任务定时器
 * @param {Object} row - 任务行数据
 * @returns {Promise<void>}
 */
export const startC5Task = async (row) => {
  try {
    // 检查任务是否已经在运行
    if (store.isTaskRunning(row.id)) {
      ElMessage({
        showClose: true,
        message: '该任务已经在运行中',
        type: 'info',
      })
      return;
    }
    
    // 立即执行一次搜索
    await executeC5Search(row);
    
    // 设置定时器，每20秒执行一次
    const timerId = setInterval(() => {
      executeC5Search(row);
    }, 20000);
    
    // 保存到全局store中
    store.setTaskTimer(row.id, timerId);
    
    ElMessage({
      showClose: true,
      message: `C5任务 ${row.name} 已启动，将每30秒自动搜索一次`,     
      type: 'success',
    })
    
    console.log(`C5任务 ${row.name} 定时器已启动，ID:`, timerId);
  } catch (error) {
    console.error('启动C5任务定时器失败:', error);
    ElMessage({
      showClose: true,
      message: '启动C5任务失败',
      type: 'error',
    })
  }
};