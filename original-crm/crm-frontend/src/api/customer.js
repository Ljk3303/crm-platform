import request from '../utils/request'

export function getCustomerList(params) {
  return request({ url: '/customers', method: 'get', params })
}

export function getCustomerDetail(id) {
  return request({ url: `/customers/${id}`, method: 'get' })
}

// Aliases for upgraded components
export const getCustomers = getCustomerList
export const getCustomer = getCustomerDetail

export function createCustomer(data) {
  return request({ url: '/customers', method: 'post', data })
}

export function updateCustomer(id, data) {
  return request({ url: `/customers/${id}`, method: 'put', data })
}

export function deleteCustomer(id) {
  return request({ url: `/customers/${id}`, method: 'delete' })
}

export function claimCustomer(id) {
  return request({ url: `/customers/${id}/claim`, method: 'post' })
}

export function getPoolCustomers(params) {
  return request({ url: '/customers/pool', method: 'get', params })
}

export function releaseCustomer(params) {
  return request({ url: '/customers/release', method: 'post', params })
}

export function transferCustomer(params) {
  return request({ url: '/customers/transfer', method: 'post', params })
}
