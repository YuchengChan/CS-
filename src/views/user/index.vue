<template>
    <div class="user-form-container">
        <el-form :model="user" :rules="rules" ref="userFormRef" label-width="120px">
            <el-form-item label="Cookie" prop="cookie" >
                <el-input v-model="cookie" autocomplete="off"  style="width: 500px;" />    
            </el-form-item>
        </el-form>
        <el-button type="primary" @click="submitForm">提交</el-button>
        <el-button type="primary" @click="resetForm">重置</el-button>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const cookie = ref('123asdasfas')

const userFormRef = ref(null)

const rules = ref({
    cookie: [
        { required: true, message: '请输入Cookie', trigger: 'blur' }
    ]
})

const submitForm = async () => {
    const valid = await userFormRef.value.validate()
    if (valid) {
        // 提交表单数据
        console.log(user.value)
    } else {
        ElMessage({
            showClose: true,
            message: '请输入Cookie',
            type: 'error',
        })
    }
}
</script>



<style scoped>
.user-form-container {
    display: flex;
}
</style>