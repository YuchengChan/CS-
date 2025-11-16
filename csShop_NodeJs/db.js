//1.导入 mysql2 模块
const mysql = require('mysql2')
// 2.建立与 MySQL 数据库的连接
const db = mysql.createPool({
  host:'localhost',				//本地数据库的地址（也可以用127.0.0.1）
  user:'root',							//登录数据库的账号
  password:'123456',		//登录数据库的密码
  database:'csshop' 		//指定要操作哪个数据库
})

db.query('SELECT 1', (err, results) => {
  if (err) {
    // 连接失败（或查询失败）
    console.error('数据库连接失败：', err.message)
    return
  }
  // 连接成功（查询结果应为 [{ '1': 1 }]）
  console.log('数据库连接成功！测试查询结果：', results)
})

module.exports = db