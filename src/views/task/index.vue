<template>
    <div>
        <el-button type="primary" @click="dialogFormVisible = true">添加任务</el-button>
        <!-- 任务添加弹窗 -->
        <el-dialog v-model="dialogFormVisible" title="添加任务" width="400">
            <el-form :model="task">
                <el-form-item label="任务名称" :label-width="formLabelWidth">
                    <el-input v-model="task.name" autocomplete="off" />
                </el-form-item>
                <el-form-item label="商品ID" :label-width="formLabelWidth">
                    <el-input v-model="task.id" autocomplete="off" />
                </el-form-item>
                <el-form-item label="磨损" :label-width="formLabelWidth">
                    <el-input v-model="task.wear" autocomplete="off" />
                </el-form-item>
                <el-form-item label="价格" :label-width="formLabelWidth">
                    <el-input v-model="task.price" autocomplete="off" />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" @click="addTask">
                        Confirm
                    </el-button>
                </div>
            </template>
        </el-dialog>
        <!-- 任务列表 -->
        <el-table :data="tableData" border style="width: 100%">
            <el-table-column prop="name" label="名称" width="320" />
            <el-table-column prop="id" label="商品ID" width="220" />
            <el-table-column prop="wear" label="磨损" width="220" />              
            <el-table-column prop="price" label="售卖价格" width="120" class-name="price-column"/>  
            <el-table-column label="操作" width="120" >                           
                <template #default="scope">
                    <el-button type="danger" size="mini" @click="deleteTask(scope.row)">删除</el-button>
                    <el-button type="primary" size="mini" @click="editTask(scope.row)">编辑</el-button>
                    <el-button v-if="!store.isTaskRunning(scope.row.id)" type="primary" size="mini" @click="startTask(scope.row)">启动</el-button>
                    <el-button v-else type="warning" size="mini" @click="stopTask(scope.row)">停止</el-button>
                </template>
            </el-table-column>
            
        </el-table>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../../request'
import { ElMessage, ElMessageBox } from 'element-plus'
import { store } from '../../store'

const dialogFormVisible = ref(false)
const task = ref({
    name: '',
    id: null,
    wear: null,
    price: null
})
const tableData = ref([])
// 现在使用store中的taskTimers，不再使用局部状态

onMounted(async () => {
    // 清空store数据，确保每次打开页面时仓库为空
    store.clearProducts()
    await fetchTasks();
})

// 添加任务
const addTask = async () => {
    try {
        const response = await request.post('/api/task/add', task.value);
        if (response.data.code === 200) {
            ElMessage({
                showClose: true,
                message: '添加任务成功',
                type: 'success',
            })
            dialogFormVisible.value = false;
            await fetchTasks();
        } else {
            ElMessage({
                showClose: true,
                message: response.data.msg || '添加任务失败',
                type: 'error',
            })
        }
    } catch (error) {
        console.error('添加任务失败:', error);
        ElMessage({
            showClose: true,
            message: '添加任务失败',
            type: 'error',
        })
    }
}    

// 删除任务
const deleteTask = async (row) => { 
     try { 
         const response = await request.delete('/api/task/delete', { data: { id: row.id } }); 
         if (response.data.code === 200) { 
             ElMessage({ 
                 showClose: true, 
                 message: '删除任务成功', 
                 type: 'success', 
             }) 
             await fetchTasks(); 
         } else { 
             ElMessage({ 
                 showClose: true, 
                 message: response.data.msg || '删除任务失败', 
                 type: 'error', 
             }) 
         } 
     } catch (error) { 
         console.error('删除任务失败:', error); 
         ElMessage({ 
             showClose: true, 
             message: '删除任务失败', 
             type: 'error', 
         }) 
     } 
 }

// 执行搜索任务的函数
const executeSearchTask = async (row) => {
    try {
        // 注意：这里API路径应该是'/api/task/start-search'而不是'/api/task/start'
        const response = await request.post('/api/task/start-search', { id: row.id });
        
        if (response.data.code === 200) {
            ElMessage({
                showClose: true,
                message: `任务 ${row.name} 搜索成功: ${response.data.message}`,
                type: 'success',
            })
            // 如果找到满足条件的商品，将数据存储到store中
            console.log('找到满足条件的商品:', response);
            
            // 处理后端返回的数据，包含task和item两个部分
            const { task: dbTask, item: apiItem } = response.data.data;
            
            // 构建商品数据对象，包含shop.vue表格需要的字段
            const productData = {
                id: `${dbTask.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // 使用任务ID+时间戳+随机字符串确保唯一标识
                name: dbTask.name,
                img: apiItem.asset_info?.info?.icon_url || apiItem.img || '', // 使用asset_info.info.icon_url作为图片URL
                wear: apiItem.asset_info?.paintwear || dbTask.wear,
                price: apiItem.price,
                buyPrice: dbTask.price, // 购买价格从任务设置中获取
                link: `https://buff.163.com/goods/${dbTask.id}`, // 构建购买链接，确保apiItem.id是简单数字格式的商品ID（如示例中的34830）
                searchTime: new Date(), // 添加搜索时间
                originalItemId: apiItem.id // 保留原始商品ID用于识别同一商品
            };
            
            // 存储到全局store中
            store.addProduct(productData);
        } else if (response.data.code === 201) {
            console.log(`任务 ${row.name} 未找到满足条件的商品，继续搜索...`);
        } else {
            ElMessage({
                showClose: true,
                message: response.data.message || '搜索任务执行失败',
                type: 'warning',
            })
            console.log(`任务 ${row.name} 执行状态:`, response.data);
        }
    } catch (error) {
        console.error(`任务 ${row.name} 执行失败:`, error);
    }
}

// 启动任务定时器
const startTask = async (row) => {
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
        await executeSearchTask(row);
        
        // 设置定时器，每15秒执行一次
        const timerId = setInterval(() => {
            executeSearchTask(row);
        }, 15000);
        
        // 保存到全局store中
        store.setTaskTimer(row.id, timerId);
        
        ElMessage({
            showClose: true,
            message: `任务 ${row.name} 已启动，将每15秒自动搜索一次`,   
            type: 'success',
        })
        
        console.log(`任务 ${row.name} 定时器已启动，ID:`, timerId);
    } catch (error) {
        console.error('启动任务定时器失败:', error);
        ElMessage({
            showClose: true,
            message: '启动任务失败',
            type: 'error',
        })
    }
}

// 停止任务定时器
const stopTask = (row) => {
    try {
        // 使用store中的方法停止定时器
        store.clearTaskTimer(row.id);
        
        ElMessage({
            showClose: true,
            message: `任务 ${row.name} 已停止`,
            type: 'success',
        })
        
        console.log(`任务 ${row.name} 定时器已停止`);
    } catch (error) {
        console.error('停止任务失败:', error);
        ElMessage({
            showClose: true,
            message: '停止任务失败',
            type: 'error',
        })
    }
}

// 分离获取任务列表的逻辑，避免直接调用onMounted
const fetchTasks = async () => {
    try {
        const response = await request.get('/api/task/list');
        tableData.value = response.data || [];
        console.log('获取的任务列表:', tableData.value);
    } catch (error) {
        console.error('获取任务列表失败:', error);
        ElMessage({
            showClose: true,
            message: '获取任务列表失败',
            type: 'error',
        })
    }
}


</script>

<style scoped></style>