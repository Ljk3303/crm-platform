import request from '../utils/request'

export function getQuotationList(params) {
  return request({ url: '/quotations/list', method: 'get', params })
}
export const getQuotations = getQuotationList

export function getQuotationDetail(id) {
  return request({ url: `/quotations/${id}`, method: 'get' })
}
export const getQuotation = getQuotationDetail

export function createQuotation(data) {
  return request({ url: '/quotations', method: 'post', data })
}

export function updateQuotation(id, data) {
  return request({ url: `/quotations/${id}`, method: 'put', data })
}

export function deleteQuotation(id) {
  return request({ url: `/quotations/${id}`, method: 'delete' })
}

export function submitQuotation(id) {
  return request({ url: `/quotations/${id}/submit`, method: 'post' })
}

export function approveQuotation(id, data) {
  return request({ url: `/quotations/${id}/approve`, method: 'post', data })
}

export function rejectQuotation(id, data) {
  return request({ url: `/quotations/${id}/reject`, method: 'post', data })
}

export function convertToOrder(id) {
  return request({ url: `/quotations/${id}/convert-to-order`, method: 'post' })
}
