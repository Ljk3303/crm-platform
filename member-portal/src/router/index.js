import { createRouter, createWebHistory } from 'vue-router';
const routes = [
  { path: '/', component: () => import('@/views/Home.vue'), meta: { title: '首页' } },
  { path: '/products', component: () => import('@/views/ProductList.vue'), meta: { title: '全部商品' } },
  { path: '/products/:id', component: () => import('@/views/ProductDetail.vue'), meta: { title: '商品详情' } },
  { path: '/login', component: () => import('@/views/Login.vue'), meta: { title: '登录' } },
  { path: '/register', component: () => import('@/views/Register.vue'), meta: { title: '注册' } },
  { path: '/cart', component: () => import('@/views/Cart.vue'), meta: { title: '购物车', needAuth: true } },
  { path: '/member', component: () => import('@/views/Member.vue'), meta: { title: '会员中心', needAuth: true } },
  { path: '/points', component: () => import('@/views/Points.vue'), meta: { title: '积分中心', needAuth: true } },
  { path: '/coupons', component: () => import('@/views/Coupons.vue'), meta: { title: '领券中心', needAuth: true } },
  { path: '/orders', component: () => import('@/views/Orders.vue'), meta: { title: '我的订单', needAuth: true } },
  { path: '/orders/:id', component: () => import('@/views/OrderDetail.vue'), meta: { title: '订单详情', needAuth: true } },
  { path: '/profile', component: () => import('@/views/Profile.vue'), meta: { title: '个人中心', needAuth: true } },
  { path: '/address', component: () => import('@/views/Address.vue'), meta: { title: '地址管理', needAuth: true } },
  { path: '/favorites', component: () => import('@/views/Favorites.vue'), meta: { title: '我的收藏', needAuth: true } },
  { path: '/feedback', component: () => import('@/views/Feedback.vue'), meta: { title: '意见反馈', needAuth: true } },
  { path: '/group-buy', component: () => import('@/views/GroupBuy.vue'), meta: { title: '拼团购买', needAuth: true } },
  { path: '/student-verify', component: () => import('@/views/StudentVerify.vue'), meta: { title: '学生认证', needAuth: true } },
];
const router = createRouter({ history: createWebHistory(), routes });
router.beforeEach((to, from, next) => {
  if (to.meta.needAuth && !localStorage.getItem('m_token')) next('/login');
  else next();
});
export default router;
