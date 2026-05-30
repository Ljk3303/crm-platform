import request from './request'

export function getCustomerList(params) {
  return request({ url: '/customers', method: 'get', params })
}

export function getCustomerDetail(id) {
  return request({ url: `/customers/${id}`, method: 'get' })
}
