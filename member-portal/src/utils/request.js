import axios from 'axios';
const request = axios.create({ baseURL: 'https://upset-ideas-grab.loca.lt/api/member-portal', timeout: 10000 });
request.interceptors.request.use(c => { const t = localStorage.getItem('m_token'); if (t) c.headers.Authorization = 'Bearer ' + t; c.headers['Bypass-Tunnel-Reminder'] = 'true'; return c; });
request.interceptors.response.use(r => { if (r.data.code !== 200) { return Promise.reject(r.data); } return r.data.data; }, e => { if (e.response?.status === 401) { localStorage.removeItem('m_token'); window.location.href = '/login'; } return Promise.reject(e); });
export default request;
