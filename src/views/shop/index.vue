<template>
    <div>
        <!-- 操作按钮区域 -->
        <div style="margin-bottom: 20px; text-align: right;">
            <el-button type="danger" @click="clearProducts">清空商品</el-button>
        </div>
        
        <el-table :data="tableData" border style="width: 100%">
            <el-table-column prop="name" label="名称" width="320" />
            <el-table-column label="图片" width="150" >
                <template #default="scope">
                    <img :src="scope.row.img" alt="商品图片" style="width: 100px; height: 100px; object-fit: cover;" />
                </template>
            </el-table-column>
            <el-table-column prop="wear" label="磨损" width="220" />
            <el-table-column prop="price" label="售卖价格" width="120" class-name="price-column"/>
            <el-table-column prop="buyPrice" label="购买价格" width="120"  />
            <el-table-column label="搜索时间" width="180">
                <template #default="scope">
                    {{ formatDate(scope.row.searchTime) }}
                </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
                <template #default="scope">
                    <el-button type="primary" size="small" @click="openLink(scope.row.link)">购买</el-button>
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
import { ref, computed, onMounted } from 'vue'
import { ElTable, ElTableColumn, ElButton } from 'element-plus'
import 'element-plus/dist/index.css'
import { store } from '../../store'

// 计算属性，从store获取商品数据
const tableData = computed(() => store.products)

// 组件挂载时打印store中的数据用于调试
onMounted(() => {
  console.log('Shop组件挂载时的商品数据:', tableData.value)
})

const openLink = (link) => {
  // 直接打开链接，因为link字段已经是完整的链接格式
  window.open(link, '_blank')
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

::v-deep .el-table__body-wrapper td.price-column .cell {
  color: #ff0000; /* 精准定位售卖价格列，优先级更高 */
}
</style>