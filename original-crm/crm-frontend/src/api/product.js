import request from '../utils/request'

export function getProductList(params) {
  return request({ url: '/products/list', method: 'get', params })
}
export const getProducts = getProductList

export function getProductDetail(id) {
  return request({ url: `/products/${id}`, method: 'get' })
}
export const getProduct = getProductDetail

export function createProduct(data) {
  return request({ url: '/products', method: 'post', data })
}

export function updateProduct(id, data) {
  return request({ url: '/products', method: 'put', data })
}

export function deleteProduct(id) {
  return request({ url: `/products/${id}`, method: 'delete' })
}

export function getProductCategories() {
  return request({ url: '/products/categories', method: 'get' })
}

export function getPriceStrategies(productId) {
  return request({ url: `/products/${productId}/prices`, method: 'get' })
}

export function savePriceStrategies(productId, data) {
  return request({ url: `/products/${productId}/prices`, method: 'post', data })
}

export const productApi = {
  list: (params) => request.get('/products/list', { params }),
  getById: (id) => request.get(`/products/${id}`),
  top: (n = 5) => request.get(`/products/top?n=${n}`),
  categories: () => request.get('/products/categories'),
  analytics: () => request.get('/products/analytics'),
}
