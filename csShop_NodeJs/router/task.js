const express = require('express')  
const router = express.Router()  
const db = require('../db.js')  
const axios = require('axios')		
const { sendToWechatBot } = require('../wechatBot.js')

const cookie = 'Device-Id=G0gvyUByJ7Kg7cRWznYG; remember_me=U1091788859|95ImIR8lCpgL3nqz7PhzMehNaOxwOzAC; session=1-BGXz-hYynwvX5EMSP1lRorMuDF_81EB714CRh3tb8-za2044591971; Locale-Supported=zh-Hans; game=csgo; csrf_token=IjgxYmNjYjMxODE0NTJiZTcwM2RlM2E1MmY3Zjk3ZDJkZWZmOWU2Zjci.aQwJLg.w_cjQvRavjsnN6RUWTzcftBfIhc'
// C5平台API密钥
const C5_APP_KEY = 'babd002c6be6486d87d601d207a0cc8f'

// 挂载获取任务列表的路由
router.get('/task/list', function(req, res){		
  db.query('SELECT * FROM task', (err, results) => {
    if (err) {
      // 查询失败
      console.error('查询任务列表失败：', err.message)
      return
    }
    // 查询成功
    console.log('查询任务列表成功！任务列表：', results)
    res.send(results)
  })
})

// 挂载添加任务的路由                    
router.post('/task/add', function(req,res){            
  const task = req.body
  
  // 处理平台参数，将前端的字符串格式转换为数据库中的数字格式
  // BUFF -> 0, C5 -> 1，默认使用BUFF平台(0)
  if (task.platform) {
    task.platform = task.platform === 'C5' ? 1 : 0
  } else {
    task.platform = 0 // 默认使用BUFF平台
  }
  
  // 处理购买链接字段，确保非必需字段的正确处理
  // 如果link字段为空字符串或未定义，将其设置为null
  if (task.link === '' || task.link === undefined) {
    task.link = null
  }
  
  console.log('添加任务，平台参数已转换:', task.platform)
  if (task.link) {
    console.log('购买链接已提供:', task.link)
  }
  
  db.query('INSERT INTO task SET ?', task, (err, results) => {
    if (err) {
      // 添加失败
      console.error('添加任务失败：', err.message)
      res.send({
        code: 500,
        message: '添加任务失败',
        error: err.message
      })
      return
    }
    // 添加成功
    console.log('添加任务成功！任务ID：', results.insertId)
    res.send({
      code: 200,
      message: '添加任务成功',
      id: results.insertId
    })
  })
})

// 挂载删除任务的路由
router.delete('/task/delete', function(req,res){			
  const taskId = req.body.id
  db.query('DELETE FROM task WHERE id = ?', taskId, (err, results) => {
    if (err) {
      // 删除失败
      console.error('删除任务失败：', err.message)
      return
    }
    // 删除成功
    console.log('删除任务成功！任务ID：', taskId)
    res.send({
      code: 200,
      message: '删除任务成功'
    })
  })
})



// 挂载启动搜索任务的路由
router.post('/task/start-search', async function(req, res) {
  try {
    const { id } = req.body
    
    // 1. 根据id查询数据库
    const taskQuery = new Promise((resolve, reject) => {
      db.query('SELECT * FROM task WHERE id = ?', id, (err, results) => {
        if (err) {
          console.error('查询任务失败：', err.message)
          reject(err)
          return
        }
        if (results.length === 0) {
          reject(new Error('任务不存在'))
          return
        }
        resolve(results[0])
      })
    })
    
    const task = await taskQuery
    // 数据库中的id字段直接存储商品ID，直接使用它
    const goodsId = task.id
    
    // 从数据库中读取平台参数，0代表BUFF，1代表C5
    // 默认如果没有platform字段或字段值无效，则使用BUFF平台
    let platform = 'BUFF'
    if (task.platform === 1) {
      platform = 'C5'
    } else if (task.platform === 0 || !task.platform) {
      platform = 'BUFF'
    }
    
    console.log(`任务ID: ${id}, 平台: ${platform} (数据库值: ${task.platform})`)
    
    let item = null
    let apiPrice = 0
    let apiWear = 1
    
    // 2. 根据平台选择不同的请求方式
    if (platform === 'C5') {
      // C5平台请求逻辑 - 使用新的API接口
      const url = 'https://openapi.c5game.com//merchant/market/v2/products/condition/hash/name'
      const params = {
        'app-key': C5_APP_KEY
      }
      
      // 使用数据库中的名称作为marketHashName
      const requestBody = {
        pageNum: 1,
        pageSize: 1,
        appId: 730,
        marketHashName: task.name, // 从数据库中获取商品名称
        maxPrice: task.price * 100, // 价格转换为分
        delivery: 0
      }
      
      console.log(`正在请求C5平台商品，URL: ${url}`)
      console.log(`C5请求参数:`, requestBody)
      
      try {
        const response = await axios.post(url, requestBody, {
          params: params,
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        console.log(`C5响应状态码: ${response.status}`)
        console.log(`C5响应数据结构:`, JSON.stringify({
          data_keys: Object.keys(response.data),
          has_data: 'data' in response.data
        }, null, 2))
        
        // 解析C5响应数据 - 使用正确的数据结构，增强错误处理
        console.log('C5响应完整数据:', JSON.stringify(response.data, null, 2))
        
        try {
          // 检查响应是否成功
          if (!response.data.success) {
            throw new Error(`C5 API返回失败: ${response.data.errorMsg || '未知错误'}`)
          }
          
          // 检查数据结构完整性
          if (!response.data.data) {
            throw new Error('C5 API返回数据结构不完整: data字段缺失')
          }
          
          if (!response.data.data.list || !Array.isArray(response.data.data.list)) {
            throw new Error('C5 API返回数据结构不完整: list字段缺失或不是数组')
          }
          
          if (response.data.data.list.length === 0) {
            console.log(`C5平台未找到商品名为${task.name}的商品数据`)
            return res.send({
              code: 404,
              message: `C5平台未找到对应的商品数据，商品名称: ${task.name}`,
              debug_info: {
                response_data: response.data
              }
            })
          }
          
          // 获取第一个商品（价格最低的）
          item = response.data.data.list[0]
          
          // 数据提取错误处理
          if (!item) {
            throw new Error('无法获取商品信息: list[0]为空')
          }
          
          // 价格已经是元单位，无需转换
          apiPrice = item.price !== undefined ? parseFloat(item.price) || 0 : 0
          
          // 磨损值从assetInfo.wear获取，添加空值检查
          apiWear = 1 // 默认值
          if (item.assetInfo && item.assetInfo.wear !== undefined) {
            apiWear = parseFloat(item.assetInfo.wear) || 1
          }
          
          // 确保商品名称存在
          const itemName = item.itemName || item.marketHashName || '未知商品'
          console.log(`成功获取C5商品信息 - 名称: ${itemName}, 价格: ${apiPrice}, 磨损: ${apiWear}`)
          
        } catch (parseError) {
          console.error('解析C5响应数据失败:', parseError.message)
          return res.send({
            code: 500,
            message: `解析C5平台响应数据失败: ${parseError.message}`,
            debug_info: {
              error_type: 'response_parsing_error',
              error_message: parseError.message,
              response_structure: Object.keys(response.data || {})
            }
          })
        }
      } catch (axiosError) {
        console.error(`请求C5平台商品ID ${goodsId} 失败:`, axiosError.message)
        // 更详细的错误信息处理
        let errorMessage = axiosError.message
        let errorDetails = {}
        
        if (axiosError.response) {
          // 请求已发出，但服务器响应状态码不在2xx范围
          errorMessage = `HTTP ${axiosError.response.status}: ${axiosError.response.statusText}`
          errorDetails = {
            status_code: axiosError.response.status,
            status_text: axiosError.response.statusText,
            response_headers: Object.keys(axiosError.response.headers || {}),
            response_data_keys: axiosError.response.data ? Object.keys(axiosError.response.data) : []
          }
        } else if (axiosError.request) {
          // 请求已发出，但没有收到响应
          errorMessage = '未收到服务器响应'
          errorDetails = {
            request_details: axiosError.request
          }
        }
        
        return res.send({
          code: 500,
          message: `请求C5平台商品数据失败: ${errorMessage}`,
          goods_id: goodsId,
          error_type: 'api_request_error',
          error_details: errorDetails
        })
      }
    } else {
      // 默认BUFF平台请求逻辑
      const url = `https://buff.163.com/api/market/goods/sell_order?game=csgo&goods_id=${goodsId}&sort_by=default`
      console.log(`正在请求BUFF平台商品ID: ${goodsId}，URL: ${url}`)
      
      try {
        const response = await axios.get(url, {
          headers: {
            'Cookie': cookie
          }
        })
        
        console.log(`BUFF响应状态码: ${response.status}`)
        console.log(`BUFF响应数据结构:`, JSON.stringify({
          data_keys: Object.keys(response.data),
          has_data: 'data' in response.data,
          data_has_items: response.data.data && 'items' in response.data.data
        }, null, 2))
        
        // 获取BUFF数据
        const itemsArray = response.data.data && response.data.data.items && Array.isArray(response.data.data.items) ? response.data.data.items : []
        item = itemsArray.length > 0 ? itemsArray[0] : null
        
        if (!item) {
          console.log(`BUFF平台未找到商品ID为${goodsId}的商品数据`)
          return res.send({
            code: 404,
            message: `BUFF平台未找到对应的商品数据，商品ID: ${goodsId}`,
            debug_info: {
              response_data_keys: Object.keys(response.data),
              has_data_field: 'data' in response.data,
              data_has_items: response.data.data && 'items' in response.data.data,
              items_status: Array.isArray(itemsArray) ? `数组长度: ${itemsArray.length}` : `非数组类型: ${typeof itemsArray}`
            }
          })
        }
        
        // 获取BUFF价格和磨损值
        apiPrice = parseFloat(item.price) || 0
        const paintwearValue = item.asset_info && item.asset_info.paintwear ? item.asset_info.paintwear : '1'
        apiWear = parseFloat(paintwearValue) || 1
      } catch (axiosError) {
        console.error(`请求BUFF平台商品ID ${goodsId} 失败:`, axiosError.message)
        if (axiosError.response) {
          console.error(`响应错误状态码: ${axiosError.response.status}`)
          console.error(`响应错误数据:`, axiosError.response.data)
        }
        return res.send({
          code: 500,
          message: `请求BUFF平台商品数据失败: ${axiosError.message}`,
          goods_id: goodsId
        })
      }
    }
    
    // 5. 比较price和wear
    const dbPrice = parseFloat(task.price) || 0
    const dbWear = parseFloat(task.wear) || 1
      
      if (apiPrice <= dbPrice || apiWear <= dbWear) {
        // 满足条件，同时返回数据库查询的任务数据和接口返回的商品数据
        console.log(`商品ID ${goodsId} 满足条件，返回数据库任务数据和查询接口的商品数据`)
        
        // 构建商品数据并推送到企业微信机器人
        const productData = {
          id: goodsId,
          name: task.name,
          price: apiPrice,
          buyPrice: task.price,
          wear: apiWear,
          // 根据平台使用不同的购买链接
          // C5平台使用数据库中的link字段值，BUFF平台使用固定格式的URL
          link: platform === 'C5' 
            ? task.link || `https://www.c5game.com/csgo/item/${goodsId}.html` 
            : `https://buff.163.com/goods/${goodsId}?game=csgo`,
          // 添加空值检查提示
          linkStatus: !task.link && platform === 'C5' ? '数据库中link字段为空，使用默认链接' : '正常',
          platform: platform, // 前端友好的平台名称
          platformId: task.platform // 数据库中的平台ID (0或1)
        };
        
        // 异步推送消息，不阻塞响应
        sendToWechatBot(productData).catch(err => {
          console.error('推送消息失败，不影响业务逻辑:', err);
        });
        
        return res.send({
          code: 200,
          message: '找到满足条件的商品',
          data: {
            task: task,  // 返回数据库查询的任务数据
            item: item   // 返回查询接口的商品数据
          }
        })
      } else {
        // 不满足条件
        return res.send({
          code: 201,
          message: '未找到满足条件的商品',
          data: {
            apiPrice,
            apiWear,
            dbPrice,
            dbWear
          }
        })
      }
  } catch (error) {
    console.error('启动搜索任务失败：', error.message)
    res.send({
      code: 500,
      message: '启动搜索任务失败：' + error.message
    })
  }
})

module.exports = router