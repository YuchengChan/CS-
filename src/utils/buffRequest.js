import request from '../request';
import { ElMessage } from 'element-plus';
import { store } from '../store';

/**
 * 执行BUFF平台的搜索任务
 * @param {Object} row - 任务行数据
 * @returns {Promise<void>}
 */
export const executeBuffSearch = async (row) => {
  try {
    // 发送请求到后端，明确指定平台为BUFF
    const response = await request.post('/api/task/start-search', {
      id: row.id,
      platform: 'BUFF'
    });
    
    if (response.data.code === 200) {
      ElMessage({
        showClose: true,
        message: `任务 ${row.name} 搜索成功: ${response.data.message}`,
        type: 'success',
      })
      // 如果找到满足条件的商品，将数据存储到store中
      console.log('找到满足条件的BUFF平台商品:', response);
      
      // 处理后端返回的数据，包含task和item两个部分
      const { task: dbTask, item: apiItem } = response.data.data;
      
      // 构建BUFF平台商品数据对象，包含shop.vue表格需要的字段
      const productData = {
        id: `${dbTask.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // 使用任务ID+时间戳+随机字符串确保唯一标识
        name: dbTask.name,
        img: apiItem.asset_info?.info?.icon_url || apiItem.img || '', // 使用asset_info.info.icon_url作为图片URL
        wear: apiItem.asset_info?.paintwear || dbTask.wear,
        price: apiItem.price,
        buyPrice: dbTask.price, // 购买价格从任务设置中获取
        // BUFF平台的购买链接
        link: `https://buff.163.com/goods/${dbTask.id}`,
        searchTime: new Date(), // 添加搜索时间
        originalItemId: apiItem.id, // 保留原始商品ID用于识别同一商品
        platform: 0 // 明确平台信息，0表示BUFF平台
      };
      
      // 存储到全局store中
      store.addProduct(productData);
    } else if (response.data.code === 201) {
      console.log(`BUFF任务 ${row.name} 未找到满足条件的商品，继续搜索...`);
    } else {
      ElMessage({
        showClose: true,
        message: response.data.message || 'BUFF平台搜索任务执行失败',
        type: 'warning',
      })
      console.log(`BUFF任务 ${row.name} 执行状态:`, response.data);
    }
  } catch (error) {
    console.error(`BUFF任务 ${row.name} 执行失败:`, error);
  }
};

/**
 * 启动BUFF平台任务定时器
 * @param {Object} row - 任务行数据
 * @returns {Promise<void>}
 */
export const startBuffTask = async (row) => {
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
    await executeBuffSearch(row);
    
    // 设置定时器，每20秒执行一次
    const timerId = setInterval(() => {
      executeBuffSearch(row);
    }, 20000);
    
    // 保存到全局store中
    store.setTaskTimer(row.id, timerId);
    
    ElMessage({
      showClose: true,
      message: `BUFF任务 ${row.name} 已启动，将每20秒自动搜索一次`,
      type: 'success',
    })
    
    console.log(`BUFF任务 ${row.name} 定时器已启动，ID:`, timerId);
  } catch (error) {
    console.error('启动BUFF任务定时器失败:', error);
    ElMessage({
      showClose: true,
      message: '启动BUFF任务失败',
      type: 'error',
    })
  }
};