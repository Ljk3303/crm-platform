import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import { ElMessage } from 'element-plus'
import 'element-plus/dist/index.css'
import './styles/design-tokens.css'
import './styles/global.css'
import './styles/premium-theme.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'

const app = createApp(App)
app.use(ElementPlus, { locale: zhCn })
app.use(router)
app.use(createPinia())

// 全局错误处理器：捕获未处理的 Vue 运行时错误
app.config.errorHandler = (err, instance, info) => {
  console.error('[Vue Error]', info, err)
  if (err instanceof Error && err.message && err.message.includes('Failed to fetch dynamically imported module')) {
    ElMessage.error('页面加载失败，请刷新后重试')
  }
}

// 全局 Promise rejection 捕获（防止未捕获的 async 错误）
window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Promise Rejection]', event.reason)
  event.preventDefault()
})

app.mount('#app')
