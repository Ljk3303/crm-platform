import request from '../utils/request'

export function getOpportunities(params) {
  return request({ url: '/opportunities/list', method: 'get', params })
}

export function getOpportunity(id) {
  return request({ url: `/opportunities/${id}`, method: 'get' })
}

export function createOpportunity(data) {
  return request({ url: '/opportunities', method: 'post', data })
}

export function updateOpportunity(id, data) {
  return request({ url: `/opportunities/${id}`, method: 'put', data })
}

export function deleteOpportunity(id) {
  return request({ url: `/opportunities/${id}`, method: 'delete' })
}

export function updateOpportunityStage(id, data) {
  return request({ url: `/opportunities/${id}/stage`, method: 'put', data })
}

export function getOpportunityFunnel() {
  return request({ url: '/opportunities/funnel', method: 'get' })
}
