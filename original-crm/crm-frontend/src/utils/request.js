import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: '/api',
  timeout: 30000
})

// 请求拦截器：附加 token
request.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 响应拦截器
request.interceptors.response.use(
  response => {
    const res = response.data
    // 后端统一响应格式: { code: 200, message: '...', data: ... }
    if (res.code !== 200) {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res.data
  },
  error => {
    // 提取错误信息
    const msg = error.response?.data?.message
      || error.response?.data?.msg
      || error.message
      || '网络错误'

    if (error.response?.status === 401) {
      const token = localStorage.getItem('token')
      if (token) {
        localStorage.removeItem('token')
        localStorage.removeItem('realName')
        localStorage.removeItem('role')
        ElMessage.error('登录已过期，请重新登录')
        setTimeout(() => {
          window.location.href = '/login'
        }, 500)
      } else {
        ElMessage.error(msg)
      }
    } else if (error.response?.status === 403) {
      ElMessage.error('没有操作权限')
    } else if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请稍后重试')
    } else if (!error.response) {
      ElMessage.error('网络连接失败，请检查网络')
    } else {
      ElMessage.error(msg)
    }
    return Promise.reject(error)
  }
)

export default request
