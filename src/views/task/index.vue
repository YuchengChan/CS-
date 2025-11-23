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
                <el-form-item label="购买平台" :label-width="formLabelWidth">
                    <el-radio-group v-model="task.platform" size="small">
                        <el-radio label="BUFF">BUFF</el-radio>
                        <el-radio label="C5">C5</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="购买连接" :label-width="formLabelWidth">
                    <el-input v-model="task.link" autocomplete="off" />
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
            <el-table-column prop="platform" label="购买平台" width="120" />
            <el-table-column label="操作" width="250" >                           
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
// 导入平台特定的请求模块
import { executeBuffSearch, startBuffTask } from '../../utils/buffRequest'
import { executeC5Search, startC5Task } from '../../utils/c5Request'

const dialogFormVisible = ref(false)
const task = ref({
    name: '',
    id: null,
    wear: null,
    price: null,
    platform: 'C5',
    link: ''
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

// 执行搜索任务的函数 - 根据平台调用相应的模块函数
const executeSearchTask = async (row) => {
    // 根据平台选择不同的请求处理模块
    const platform = row.platform || 'BUFF'; // 默认使用BUFF平台
    
    console.log(`开始执行${platform}平台的搜索任务: ${row.name}`);
    
    // 调用相应平台的搜索函数
    if (platform === 'C5') {
        await executeC5Search(row);
    } else {
        await executeBuffSearch(row);
    }
}

// 启动任务定时器 - 根据平台调用相应的模块函数
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
        
        // 根据平台选择不同的启动任务方法
        const platform = row.platform || 'BUFF';
        
        if (platform === 'C5') {
            await startC5Task(row);
        } else {
            await startBuffTask(row);
        }
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
        // 将platform的数字值转换为对应的平台名称
        tableData.value = (response.data || []).map(task => ({
            ...task,
            platform: task.platform === 1 ? 'C5' : 'BUFF'
        }));
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