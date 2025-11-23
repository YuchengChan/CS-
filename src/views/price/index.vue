<template>
    <div>
       <el-button type="primary" @click="dialogFormVisible = true">添加价格对比</el-button>
        <!-- 价格对比添加弹窗 -->
        <el-dialog v-model="dialogFormVisible" title="添加价格对比" width="400">
            <el-form :model="price">
                <el-form-item label="商品名称" :label-width="formLabelWidth">
                    <el-input v-model="price.name" autocomplete="off" />
                </el-form-item>
                <el-form-item label="英文名称" :label-width="formLabelWidth">
                    <el-input v-model="price.en_name" autocomplete="off" />
                </el-form-item>
                <el-form-item label="目标价格" :label-width="formLabelWidth">
                    <el-input v-model="price.target_price" autocomplete="off" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button type="primary" @click="submitForm">添加</el-button>
            </template>
        </el-dialog>
        <!-- 价格对比列表 -->
        <el-table :data="tableData" border style="width: 100%">
            <el-table-column prop="name" label="商品名称" width="250" />
            <el-table-column prop="en_name" label="英文名称" width="250" />
            <el-table-column prop="target_price" label="目标价格" width="220" class-name="price-column" />
            <el-table-column prop="buy_price" label="购买价格" width="220" class-name="price-column">
                <template #default="scope">
                    <span :style="{ color: scope.row.buy_price <= scope.row.target_price ? 'red' : '' }">
                        {{ scope.row.buy_price }}
                    </span>
                </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
                <template #default="scope">
                    <el-button type="danger" size="mini" @click="deletePrice(scope.row)">删除</el-button>
                </template>
            </el-table-column>
        </el-table>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElTable, ElTableColumn, ElButton, ElMessage } from 'element-plus'
import 'element-plus/dist/index.css'
import { store } from '../../store'

const dialogFormVisible = ref(false)
const price = ref({
    name: '',
    en_name: '',
    target_price: null,
    buy_price: null,
    buy_link: ''
})
const tableData = ref([])

// 添加价格对比数据
const submitForm = async () => {
  // 表单验证
  if (!price.value.name || !price.value.en_name || !price.value.target_price) {
    ElMessage.warning('请填写完整的商品信息')
    return
  }
  
  try {
    // 提交数据到后端
    await store.addPrice({
      name: price.value.name,
      en_name: price.value.en_name,
      target_price: parseFloat(price.value.target_price),
      buy_price: price.value.buy_price || 0
    })
    
    dialogFormVisible.value = false
    
    // 重置表单
    price.value = {
      name: '',
      en_name: '',
      target_price: null
    }
    
    // 刷新表格数据
    fetchPriceData()
  } catch (error) {
    console.error('添加价格对比失败:', error)
  }
}

// 删除价格对比
const deletePrice = async (row) => {
  try {
    await store.deletePrice(row.id)
    fetchPriceData()
  } catch (error) {
    console.error('删除价格对比失败:', error)
  }
}

// 获取价格对比数据
const fetchPriceData = async () => {
  try {
    await store.fetchPrices()
    tableData.value = store.prices
  } catch (error) {
    console.error('获取价格数据失败:', error)
  }
}

// 组件挂载时获取数据
onMounted(() => {
  fetchPriceData()
})

</script>

<style scoped>
/* 价格列样式 */
.price-column {
  font-size: 16px;
  font-weight: 500;
}

/* 整个表格样式 */
el-table {
  font-size: 14px;
}

/* 表头样式 */
el-table th {
  font-weight: 600;
}
</style>