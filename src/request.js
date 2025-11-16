import axios from "axios";


//创建axios实例，配置基础路径和超时时间
const request = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})


// 请求拦截器 - 确保所有POST请求都有正确的Content-Type
request.interceptors.request.use(
  config => {
    // 如果是POST请求且data存在，确保Content-Type设置正确
    if (config.method === 'post' && config.data) {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
)

export default request;