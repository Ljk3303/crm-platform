import axios from 'axios'

// Use relative path so Vite proxy forwards to backend
const request = axios.create({
  baseURL: '/api',
  timeout: 6000
})

request.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

request.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code !== 200) {
      return Promise.reject(new Error(res.message||'API error'))
    }
    return res.data
  },
  error => {
    // Silently fail on 401/404/network errors (demo mode fallback)
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
    }
    // Don't redirect, don't show error — let callers handle it
    return Promise.reject(error)
  }
)

export default request
