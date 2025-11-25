<template>
    <div>
        <!-- 操作按钮区域 -->
        <div style="margin-bottom: 20px; text-align: right;">
            <el-button type="danger" @click="clearProducts">清空商品</el-button>
        </div>
        
        <el-table :data="tableData" border style="width: 100%">
            <el-table-column prop="name" label="名称" width="320" />
            <el-table-column prop="platform" label="购买平台" width="120">
                <template #default="scope">
                    {{ scope.row.platform === 1 ? 'C5' : 'BUFF' }}
                </template>
            </el-table-column>
            <el-table-column label="图片" width="150" >
                <template #default="scope">
                    <img :src="scope.row.img" alt="商品图片" style="width: 100px; height: 100px; object-fit: cover;" />
                </template>
            </el-table-column>
            <el-table-column prop="wear" label="磨损" width="220">
                <template #default="scope">
                    <span :style="{ color: scope.row.wearIsMatch ? '#ff0000' : '#000000', fontWeight: scope.row.wearIsMatch ? 'bold' : 'normal' }">
                        {{ scope.row.wear }}
                    </span>
                </template>
            </el-table-column>
            <el-table-column prop="price" label="售卖价格" width="120">
                <template #default="scope">
                    <span :style="{ color: scope.row.priceIsMatch ? '#ff0000' : '#000000', fontWeight: scope.row.priceIsMatch ? 'bold' : 'normal' }">
                        {{ scope.row.price }}
                    </span>
                </template>
            </el-table-column>
            <el-table-column prop="buyPrice" label="购买价格" width="120"  />
            <el-table-column label="搜索时间" width="180">
                <template #default="scope">
                    {{ formatDate(scope.row.searchTime) }}
                </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
                <template #default="scope">
                    <el-button type="primary" size="small" @click="openLink(scope.row.link, scope.row.platform)">购买</el-button>
                </template>
            </el-table-column>
        </el-table>
        
    <!-- 数据为空时的提示 -->
    <div v-if="tableData.length === 0" style="text-align: center; padding: 40px; color: #909399;">
      暂无商品数据，请先在任务页面执行搜索任务
    </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElTable, ElTableColumn, ElButton, ElMessage } from 'element-plus'
import 'element-plus/dist/index.css'
import { store } from '../../store'

// 计算属性，从store获取商品数据
const tableData = computed(() => {
  return store.products;
})

// 使用Set记录已处理过的商品，避免重复处理
const processedProducts = ref(new Set())

// 生成商品唯一标识符的函数
const generateProductId = (product) => {
  // 使用商品的名称、价格、磨损值和搜索时间组合生成唯一标识
  // 如果有id字段则优先使用id
  if (product.id) {
    return product.id.toString()
  }
  return `${product.name || ''}_${product.price || ''}_${product.wear || ''}_${product.searchTime || ''}`
}

// 组件挂载时打印store中的数据用于调试并初始化已处理商品集合
onMounted(() => {
  console.log('Shop组件挂载时的商品数据:', store.products)
  // 初始化已处理商品集合，避免处理历史数据
  store.products.forEach(product => {
    const productId = generateProductId(product)
    processedProducts.value.add(productId)
  })
})

// 监听商品数据变化，当有新的符合条件的商品出现时自动打开链接
watch(() => store.products, (newProducts) => {
  console.log('商品数据已更新:', newProducts)
  
  // 遍历所有商品，找出未处理过且符合条件的新商品
  newProducts.forEach(product => {
    const productId = generateProductId(product)
    
    // 检查商品是否已处理过，以及是否符合条件
    if (!processedProducts.value.has(productId) && (product.wearIsMatch || product.priceIsMatch)) {
      // 验证链接的有效性
      if (product.link && typeof product.link === 'string') {
        console.log('自动打开符合条件的商品链接:', product.name, product.link)
        // 使用try-catch确保即使出现错误也不会影响其他商品的处理
        try {
          openLink(product.link, product.platform)
        } catch (error) {
          console.error('打开商品链接时出错:', error, '商品信息:', product)
          ElMessage.error('打开商品链接时出错，请稍后重试')
        }
      } else {
        console.warn('商品链接无效或缺失:', product.name)
      }
      
      // 将处理过的商品添加到已处理集合中
      processedProducts.value.add(productId)
    }
  })
}, { deep: true })

const openLink = (link, platform) => {
  // 当link字段为空或无效时，显示错误提示
  if (!link) {
    ElMessage.warning('该商品暂无可用的购买链接')
    return
  }
  
  // 当平台为C5(platform=1)时，使用数据库中的link字段值作为购买链接
  if (platform === 1) {
    window.open(link, '_blank')
  } else {
    // BUFF平台(platform=0)的处理保持不变
    window.open(link, '_blank')
  }
}

// 清空商品数据的方法
const clearProducts = () => {
  store.clearProducts()
}

// 格式化日期时间
const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}
</script>

<style scoped>
::v-deep .el-table__header th .cell {
  color: #000000; /* 字体颜色 */
  font-size: 20px; /* 字体大小 */
  font-weight: bold; /* 可选：加粗 */
  text-align: center; /* 居中对齐 */
}

::v-deep .el-table__body-wrapper td .cell {
  color: #000000;
  font-size: 18px; /* 字体大小 */
  font-weight: bold; /* 可选：加粗 */
  text-align: center; /* 居中对齐 */
}

/* 移除了全局价格列的红色样式，改为根据数据条件动态设置 */
</style>