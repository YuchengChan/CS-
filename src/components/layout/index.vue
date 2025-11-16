<template>
    <div class="main-layout">
        <LeftSidebar />
        <RightSidebar />
    </div>
</template>

<script setup>
import LeftSidebar from './left/LeftSidebar.vue'
import RightSidebar from './right/RightSidebar.vue'

</script>

<style scoped>
.main-layout {
    display: flex;
    width: 100%;
    height: 100vh;
    overflow: auto;
}
</style>