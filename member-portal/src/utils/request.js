import axios from 'axios';
import { ElMessage } from 'element-plus';

// 支持运行时注入后端 API 地址（用于云端部署）
// 本地开发时默认走 Vite proxy，云端部署时通过 localtunnel 注入
const baseURL = (typeof window !== 'undefined' && window.__CRM_API_URL__)
  ? window.__CRM_API_URL__
  : '/api/member-portal';

const request = axios.create({ baseURL, timeout: 15000 });

request.interceptors.request.use(c => {
  const t = localStorage.getItem('m_token');
  if (t) c.headers.Authorization = 'Bearer ' + t;
  return c;
});

request.interceptors.response.use(
  r => {
    if (r.data.code !== 200) {
      const msg = r.data.message || '请求失败';
      ElMessage.error(msg);
      return Promise.reject(new Error(msg));
    }
    return r.data.data;
  },
  e => {
    if (e.response?.status === 401) {
      localStorage.removeItem('m_token');
      ElMessage.error('登录已过期，请重新登录');
    } else if (e.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请稍后重试');
    } else if (!e.response) {
      ElMessage.error('网络连接失败');
    } else {
      ElMessage.error(e.response?.data?.message || e.message || '网络错误');
    }
    return Promise.reject(e);
  }
);

export default request;
