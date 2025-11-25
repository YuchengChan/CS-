// 价格对比路由模块
const express = require('express');
const router = express.Router();
const priceController = require('../controllers/priceController.js');

// 获取所有价格对比数据
router.get('/api/price/list', priceController.getPriceList);

// 添加价格对比记录
router.post('/api/price/add', priceController.addPriceRecord);

// 删除价格对比记录
router.post('/api/price/delete', priceController.deletePriceRecord);

// 更新所有价格数据（使用已有的getPriceList方法，该方法会自动更新价格）
router.get('/api/price/update-all', priceController.getPriceList);

module.exports = router;