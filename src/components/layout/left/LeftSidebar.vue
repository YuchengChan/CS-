<template>
  <div class="left-sidebar">
    <el-menu
        default-active="/shop"
        class="el-menu-vertical-demo"
        router
      >
        <el-menu-item index="/shop">
          <span>购买列表</span>
        </el-menu-item>
        <el-menu-item index="/task">
          <span>任务列表</span>
        </el-menu-item>
        <el-menu-item index="/user">
          <span>用户设置</span>
        </el-menu-item>
      </el-menu>
  </div>
</template>

<script setup>

</script>

<style scoped>
.left-sidebar {
    width: 200px;
    height: 100vh;
    background-color: #fff;
    border-right: 1px solid #e0e0e0;
    box-shadow: 2px 0 6px rgba(0, 0, 0, 0.05);
}

.el-menu-vertical-demo {
    border-right: none;
    height: 100%;
}

.el-menu-item {
    height: 60px;
    line-height: 60px;
    font-size: 16px;
}

.el-menu-item.is-active {
    color: #1890ff;
    background-color: #e6f7ff;
}
</style>