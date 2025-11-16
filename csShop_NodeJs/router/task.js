const express = require('express')  
const router = express.Router()  
const db = require('../db.js')  
const axios = require('axios')		
const { sendToWechatBot } = require('../wechatBot.js')

const cookie = 'Device-Id=G0gvyUByJ7Kg7cRWznYG; remember_me=U1091788859|95ImIR8lCpgL3nqz7PhzMehNaOxwOzAC; session=1-BGXz-hYynwvX5EMSP1lRorMuDF_81EB714CRh3tb8-za2044591971; Locale-Supported=zh-Hans; game=csgo; csrf_token=IjgxYmNjYjMxODE0NTJiZTcwM2RlM2E1MmY3Zjk3ZDJkZWZmOWU2Zjci.aQwJLg.w_cjQvRavjsnN6RUWTzcftBfIhc'

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
  db.query('INSERT INTO task SET ?', task, (err, results) => {
    if (err) {
      // 添加失败
      console.error('添加任务失败：', err.message)
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
    
    // 2. 向buff.163.com发送请求
    const url = `https://buff.163.com/api/market/goods/sell_order?game=csgo&goods_id=${goodsId}&sort_by=default`
    console.log(`正在请求商品ID: ${goodsId}，URL: ${url}`)
    
    try {
      const response = await axios.get(url, {
        headers: {
          'Cookie': cookie
        }
      })
      
      // 3. 输出完整的响应数据结构以便调试
      console.log(`响应状态码: ${response.status}`)
      console.log(`响应数据结构:`, JSON.stringify({
        data_keys: Object.keys(response.data),
        has_items: 'items' in response.data,
        items_type: typeof response.data.items,
        items_length: Array.isArray(response.data.items) ? response.data.items.length : 'not_array'
      }, null, 2))
      
      // 4. 获取data.data.items数组的第一个数据（根据Buff API实际返回结构）
      const itemsArray = response.data.data && response.data.data.items && Array.isArray(response.data.data.items) ? response.data.data.items : []
      const item = itemsArray.length > 0 ? itemsArray[0] : null
      
      if (!item) {
        console.log(`未找到商品ID为${goodsId}的商品数据，可能商品ID不存在或Cookie已过期或API结构变更`)
        return res.send({
          code: 404,
          message: `未找到对应的商品数据，商品ID: ${goodsId}`,
          debug_info: {
            response_data_keys: Object.keys(response.data),
            has_data_field: 'data' in response.data,
            data_has_items: response.data.data && 'items' in response.data.data,
            items_status: Array.isArray(itemsArray) ? `数组长度: ${itemsArray.length}` : `非数组类型: ${typeof itemsArray}`
          }
        })
      }
      
      // 5. 比较price和wear
      const apiPrice = parseFloat(item.price) || 0
      // 处理paintwear可能为空字符串的情况，确保不会产生NaN
      const paintwearValue = item.asset_info && item.asset_info.paintwear ? item.asset_info.paintwear : '1'
      const apiWear = parseFloat(paintwearValue) || 1
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
          link: `https://buff.163.com/goods/${goodsId}`
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
    } catch (axiosError) {
      console.error(`请求商品ID ${goodsId} 失败:`, axiosError.message)
      if (axiosError.response) {
        console.error(`响应错误状态码: ${axiosError.response.status}`)
        console.error(`响应错误数据:`, axiosError.response.data)
      }
      return res.send({
        code: 500,
        message: `请求商品数据失败: ${axiosError.message}`,
        goods_id: goodsId
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