import axios from 'axios';

async function testTaskSearch() {
  try {
    const response = await axios.post('http://localhost:8000/api/task/start-search', { id: 34828 });
    console.log('API响应:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('错误响应:', error.response.data);
    } else {
      console.log('请求错误:', error.message);
    }
  }
}

testTaskSearch();